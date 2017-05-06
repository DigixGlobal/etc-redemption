const MultiSigWallet = artifacts.require('MultiSigWallet');
const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');

// Basic integraiton tests here, full tests @
// https://github.com/ConsenSys/MultiSigWallet/blob/master/contracts/tests/test_multisig_wallet.py

contract('MultiSigWallet', function (accounts) {
  let multiSigWallet;
  let token;
  const owners = accounts.slice(0, 4);
  describe('init', function () {
    it('inits with the corect values', async function () {
      multiSigWallet = await MultiSigWallet.new(owners, 3);
      assert.equal((await multiSigWallet.getOwners.call()).join(''), owners.join(''));
      assert.equal(await multiSigWallet.required.call(), 3);
    });
  });
  describe('multi party actions', function () {
    it('can execture remote contract functions', async function () {
      token = await EtcRedemptionToken.new();
      token.transferAdmin(multiSigWallet.address);
      const transactionData = token.contract.mint.getData(accounts[0], 1337);
      const submitted = await multiSigWallet.submitTransaction(token.address, 0, transactionData, { from: owners[0] });
      const txId = submitted.logs[0].args.transactionId;
      // one confirmation, executing doesnt work
      await multiSigWallet.executeTransaction(txId, { from: accounts[5] });
      assert.equal((await multiSigWallet.transactions.call(txId))[3], false);
      // two confirmations, executing doesnt work
      await multiSigWallet.confirmTransaction(txId, { from: owners[1] });
      await multiSigWallet.executeTransaction(txId, { from: accounts[5] });
      assert.equal((await multiSigWallet.transactions.call(txId))[3], false);
      // on 3rd confirmation, it will automatically execute
      await multiSigWallet.confirmTransaction(txId, { from: owners[2] });
      assert.equal((await multiSigWallet.transactions.call(txId))[3], true);
      assert.equal(token.contract.balanceOf(accounts[0]), 1337);
    });
  });
});
