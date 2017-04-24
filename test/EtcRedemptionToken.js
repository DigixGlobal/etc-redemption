const a = require('awaiting');
const { randomAddress, assertThrow } = require('./helpers');

const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');

contract('EtcRedemptionToken', function (accounts) {
  let token;
  describe('init', function () {
    it('initializes with the correct values', async function () {
      token = await EtcRedemptionToken.new();
      assert.equal(await token.totalSupply.call(), 0);
    });
  });
  describe('fund', function () {
    it('allows funding', async function () {
      // redeploy
      await token.fund({ value: 10 });
      assert.equal(await a.callback(web3.eth.getBalance, token.address), 10);
    });
  });
  describe('redeem', function () {
    const testReceivingAccount = randomAddress();
    before('setup the balances', async function () {
      // redeploy
      token = await EtcRedemptionToken.new();
      await token.fund({ value: 100 }); // balance is now 100
      assert.equal(await a.callback(web3.eth.getBalance, token.address), 100);
      await token.mint(accounts[0], 50);
      await token.mint(accounts[1], 5);
      await token.mint(accounts[3], 1000); // intentionally supplying too much
      assert.equal(await token.totalSupply.call(), 1055);
      await token.setActivationBlock(1);
    });
    it('throws if the contract does not have enough balance', async function () {
      await assertThrow(() => token.redeem(testReceivingAccount, { from: accounts[3] }));
      assert.equal(await a.callback(web3.eth.getBalance, testReceivingAccount), 0);
    });
    it('throws if the user has no balance', async function () {
      await assertThrow(() => token.redeem(testReceivingAccount, { from: accounts[2] }));
      assert.equal(await a.callback(web3.eth.getBalance, testReceivingAccount), 0);
    });
    it('throws if a non-zero value is sent', async function () {
      await assertThrow(() => token.redeem(testReceivingAccount, { value: 1, from: accounts[0] }));
      assert.equal(await a.callback(web3.eth.getBalance, testReceivingAccount), 0);
    });
    it('succeeds when called from account with enough balance', async function () {
      assert.equal(await token.balanceOf.call(accounts[0]), 50);
      await token.redeem(testReceivingAccount, { from: accounts[0] });
      // confirm wei values
      assert.equal(await a.callback(web3.eth.getBalance, testReceivingAccount), 50);
      assert.equal(await a.callback(web3.eth.getBalance, token.address), 50);
      // confirm getter values correct
      assert.equal(await token.balanceOf.call(accounts[0]), 0);
      assert.equal(await token.redeemedOf.call(accounts[0]), 50);
      assert.equal(await token.totalRedeemed.call(), 50);
      assert.equal(await token.totalSupply.call(), 1005);
    });
    // TODO deploy a contract for testing proxy calls
  });
  describe('() default method - redeem proxy', function () {
    // this is more verbose as we're checking for unkonw gas-deducted balances
    let gasPrice;
    const total = web3.toBigNumber(1e18);
    const minted = total.dividedBy(4);
    before(async function () {
      gasPrice = await a.callback(web3.eth.getGasPrice);
      token = await EtcRedemptionToken.new();
      await token.fund({ value: total }); // balance is now 1 eth
      assert.equal(await a.callback(web3.eth.getBalance, token.address), total.toNumber());
      await token.mint(accounts[4], minted); // 0.333 ether
      await token.setActivationBlock(1);
    });
    async function testThrowAndBalance({ value, from }) {
      const beforeContractBalance = await a.callback(web3.eth.getBalance, token.address);
      const beforeUserBalance = await a.callback(web3.eth.getBalance, from);
      const minDiff = 1;
      const maxDiff = gasPrice * 2100;
      await assertThrow(() => a.callback(web3.eth.sendTransaction, { to: token.address, from, value }));
      const afterBalance = await a.callback(web3.eth.getBalance, from);
      const balanceDiff = beforeUserBalance.minus(afterBalance).toNumber();
      assert.ok(balanceDiff > minDiff && balanceDiff < maxDiff, 'balance not within gas expectations');
      assert.equal(await a.callback(web3.eth.getBalance, token.address), beforeContractBalance.toNumber());
    }
    it('throws if sent with a value transaction', async function () {
      await testThrowAndBalance({ value: minted + 50, from: accounts[4] });
    });
    it('throws if user has zero balance', async function () {
      await testThrowAndBalance({ from: accounts[0] });
    });
    it('succeeds when user has enough balance', async function () {
      const beforeContractBalance = await a.callback(web3.eth.getBalance, token.address);
      const gasEstimate = await a.callback(web3.eth.estimateGas, { to: token.address, from: accounts[4] });
      const beforeUserBalance = await a.callback(web3.eth.getBalance, accounts[4]);
      await a.callback(web3.eth.sendTransaction, { to: token.address, from: accounts[4] });
      // contract should have exactly less than the amount...
      assert.equal(await a.callback(web3.eth.getBalance, token.address), beforeContractBalance.minus(minted).toNumber());
      // calculate user's balance
      const afterUserBalance = await a.callback(web3.eth.getBalance, accounts[4]);
      const gasDiff = gasPrice.times(gasEstimate).add(minted);
      const diff = afterUserBalance - beforeUserBalance;
      assert.ok(diff > minted && diff < gasDiff, 'balance not within gas expectations');
      // confirm getter values correct
      assert.equal(await token.balanceOf.call(accounts[4]), 0);
      assert.equal(await token.redeemedOf.call(accounts[4]), minted.toNumber());
      assert.equal(await token.totalRedeemed.call(), minted.toNumber());
      assert.equal(await token.totalSupply.call(), 0);
    });
  });
});
