/*
TODO move to multisig repo
const { abi, unlinked_binary } = require('../node_modules/@digix/truffle-gnosis-multisig/build/contracts/MultiSig.json');

const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');

const a = require('../node_modules/awaiting');

// Basic integraiton tests here, full tests @
// https://github.com/ConsenSys/MultiSigWallet/blob/master/contracts/tests/test_multisig_wallet.py

contract('MultiSigWallet', function (accounts) {
  let multiSigWallet;
  let token;
  const owners = accounts.slice(0, 4);
  describe('init', function () {
    it('inits with the corect values', async function () {
      const MultiSigWallet = require('../node_modules/truffle-contract')({ abi, unlinked_binary });
      MultiSigWallet.defaults({ from: accounts[0], gas: 3000000 });
      MultiSigWallet.setProvider(web3.currentProvider);
      multiSigWallet = await MultiSigWallet.new(owners, 3);
      assert.equal((await multiSigWallet.getOwners.call()).join(''), owners.join(''));
      assert.equal(await multiSigWallet.required.call(), 3);
    });
  });
  describe('multi party actions', function () {
    beforeEach(async function () {
      token = await EtcRedemptionToken.new();
      await token.setRate(1);
      await token.fund({ value: 1000 });
      await token.setActivationBlock(1);
    });
    it('can execture remote contract functions', async function () {
      await token.transferAdmin(multiSigWallet.address);
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
    it('redeem works from multisig', async function () {
      await token.mint(multiSigWallet.address, 100);
      const recipient = accounts[4];
      const beforeBalance = await a.callback(web3.eth.getBalance, recipient);
      const transactionData = token.contract.redeem.getData(recipient);
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
      assert.equal(token.contract.balanceOf(recipient), 0);
      const afterBalance = await a.callback(web3.eth.getBalance, recipient);
      assert.equal(afterBalance, beforeBalance.add(100).toNumber());
    });
    it('() redeem works from multisig', async function () {
      await token.mint(multiSigWallet.address, 100);
      const recipient = accounts[4];
      const beforeBalance = await a.callback(web3.eth.getBalance, recipient);
      const transactionData = '0x';
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
      assert.equal(token.contract.balanceOf(recipient), 0);
      const afterBalance = await a.callback(web3.eth.getBalance, recipient);
      assert.equal(afterBalance, beforeBalance.add(100).toNumber());
    });
  });
});
*/
