const a = require('awaiting');
const defaultRate = require('../scripts/calculateRate');
const { randomAddress, assertThrow } = require('./helpers');

const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');

const MockThrowableA = artifacts.require('MockThrowableA');
const MockThrowableB = artifacts.require('MockThrowableB');
const MockThrowableC = artifacts.require('MockThrowableC');
const MockThrowableD = artifacts.require('MockThrowableD');

contract('EtcRedemptionToken', function (accounts) {
  let token;
  describe('init', function () {
    it('initializes with the correct values', async function () {
      token = await EtcRedemptionToken.new({ from: accounts[0] });
      assert.equal(await token.totalTokensRedeemed.call(), 0, 'totalTokensRedeemed not correct');
      assert.equal(await token.totalWeiRedeemed.call(), 0, 'totalWeiRedeemed not correct');
      assert.equal(await token.rate.call(), defaultRate.toString(10), 'rate not correct');
    });
  });
  describe('fund', function () {
    it('allows funding', async function () {
      await token.fund({ value: 10, from: accounts[0] });
      assert.equal(await a.callback(web3.eth.getBalance, token.address), 10);
    });
  });
  describe('rate', function () {
    it('allows admins to set the rate', async function () {
      await token.setRate(20, { from: accounts[0] });
      assert.equal(await token.rate.call(), 20);
    });
    it('prevents non-admins from setting the rate', async function () {
      await assertThrow(() => token.setRate(21, { from: accounts[1] }));
      assert.equal(await token.rate.call(), 20);
    });
  });
  describe('redeem', function () {
    const testReceivingAccount = randomAddress();
    let value;
    let rate;
    before(async function () {
      token = await EtcRedemptionToken.new({ from: accounts[0] }); // redeploy
      rate = await token.rate.call();
      value = rate.mul(100);
      await token.fund({ value, from: accounts[0] }); // now able to withdraw 100 tokens
      assert.equal(await a.callback(web3.eth.getBalance, token.address), value.toNumber());
      await token.mint(accounts[0], 50, { from: accounts[0] });
      await token.mint(accounts[1], 5, { from: accounts[0] });
      await token.mint(accounts[3], 1000, { from: accounts[0] }); // intentionally supplying too much
      assert.equal(await token.totalSupply.call(), 1055);
      await token.setActivationBlock(1, { from: accounts[0] });
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
      const expectedWei = rate.mul(50);
      const beforeValue = await token.balanceOf.call(accounts[0]);
      assert.equal(beforeValue, 50);
      await token.redeem(testReceivingAccount, { from: accounts[0] });
      // confirm wei values
      assert.equal(await a.callback(web3.eth.getBalance, testReceivingAccount), expectedWei.toString(10));
      assert.equal(await a.callback(web3.eth.getBalance, token.address), value.sub(expectedWei).toString(10));
      // confirm getter values correct
      assert.equal(await token.balanceOf.call(accounts[0]), 0);
      assert.equal(await token.redeemedOf.call(accounts[0]), 50);
      assert.equal(await token.totalTokensRedeemed.call(), 50);
      assert.equal(await token.totalWeiRedeemed.call(), expectedWei.toString(10));
      assert.equal(await token.totalSupply.call(), 1005);
    });
    it('throws when redeeming to a null address', async function () {
      token = await EtcRedemptionToken.new({ from: accounts[0] }); // redeploy
      await token.setActivationBlock(1, { from: accounts[0] });
      await token.fund({ value: rate, from: accounts[0] });
      await token.mint(accounts[0], 1, { from: accounts[0] });
      await assertThrow(() => token.redeem('0x000000000000000000000000000000000000000', { from: accounts[0] }));
      await token.redeem(accounts[0], { from: accounts[0] });
      assert.equal(await token.redeemedOf.call(accounts[0]), 1);
    });
    it('redeems the correct amount based on the rate', async function () {
      token = await EtcRedemptionToken.new({ from: accounts[0] }); // redeploy
      const testAccounts = [randomAddress(), randomAddress(), randomAddress()];
      const initialBalances = [20, 12313, 1337];
      const startingBalance = rate.mul(1337000); // ensure there's more than enough
      const rates = [rate.mul(2), rate.div(16), rate.mul(10)];
      const expectedWei = [rate.mul(2).mul(initialBalances[0]), rate.div(16).mul(initialBalances[1]), rate.mul(10).mul(initialBalances[2])];
      // start with enough
      await token.setActivationBlock(1, { from: accounts[0] });
      await token.fund({ value: startingBalance, from: accounts[0] }); // ensure we have enough
      // set the accounts
      await token.mint(accounts[0], initialBalances[0], { from: accounts[0] });
      await token.mint(accounts[1], initialBalances[1], { from: accounts[0] });
      await token.mint(accounts[2], initialBalances[2], { from: accounts[0] });
      // test 1
      await token.setRate(rates[0], { from: accounts[0] });
      await token.redeem(testAccounts[0], { from: accounts[0] });
      assert.equal(await token.balanceOf.call(accounts[0]), 0, '[0] balanceOf incorrect');
      assert.equal(await token.redeemedOf.call(accounts[0]), initialBalances[0], '[0] redeemedOf incorrect');
      assert.equal(await token.totalTokensRedeemed.call(), initialBalances[0], '[0] totalTokensRedeemed incorrect');
      assert.equal(await token.totalWeiRedeemed.call(), expectedWei[0].toNumber(), '[0] totalWeiRedeemed incorrect');
      assert.equal(await token.totalSupply.call(), initialBalances[1] + initialBalances[2], '[0] totalSupply incorrect');
      assert.equal(await a.callback(web3.eth.getBalance, testAccounts[0]), expectedWei[0].toNumber(), '[0] getBalance incorrect');
      assert.equal(await a.callback(web3.eth.getBalance, token.address), startingBalance.sub(expectedWei[0]).toNumber(), '[0] token getBalance incorrect');
      // test 2
      await token.setRate(rates[1], { from: accounts[0] });
      await token.redeem(testAccounts[1], { from: accounts[1] });
      assert.equal(await token.balanceOf.call(accounts[1]), 0, '[1] balanceOf incorrect');
      assert.equal(await token.redeemedOf.call(accounts[1]), initialBalances[1], '[1] redeemedOf incorrect');
      assert.equal(await token.totalTokensRedeemed.call(), initialBalances[1] + initialBalances[0], '[1] totalTokensRedeemed incorrect');
      assert.equal(await token.totalWeiRedeemed.call(), expectedWei[1].add(expectedWei[0]).toNumber(), '[1] totalWeiRedeemed incorrect');
      assert.equal(await token.totalSupply.call(), initialBalances[2], '[1] totalSupply incorrect');
      assert.equal(await a.callback(web3.eth.getBalance, testAccounts[1]), expectedWei[1].toNumber(), '[1] getBalance incorrect');
      assert.equal(await a.callback(web3.eth.getBalance, token.address), startingBalance.sub(expectedWei[0]).sub(expectedWei[1]).toNumber(), '[1] token getBalance incorrect');
      // rate 3
      await token.setRate(rates[2], { from: accounts[0] });
      await token.redeem(testAccounts[2], { from: accounts[2] });
      assert.equal(await token.balanceOf.call(accounts[2]), 0, '[2] balanceOf incorrect');
      assert.equal(await token.redeemedOf.call(accounts[2]), initialBalances[2], '[2] redeemedOf incorrect');
      assert.equal(await token.totalTokensRedeemed.call(), initialBalances[1] + initialBalances[0] + initialBalances[2], '[2] totalTokensRedeemed incorrect');
      assert.equal(await token.totalWeiRedeemed.call(), expectedWei[1].add(expectedWei[0]).add(expectedWei[2]).toNumber(), '[2] totalWeiRedeemed incorrect');
      assert.equal(await token.totalSupply.call(), 0, '[2] totalSupply incorrect');
      assert.equal(await a.callback(web3.eth.getBalance, testAccounts[2]), expectedWei[2].toNumber(), '[2] getBalance incorrect');
      assert.equal(await a.callback(web3.eth.getBalance, token.address), startingBalance.sub(expectedWei[0]).sub(expectedWei[1]).sub(expectedWei[2]).toNumber(), '[2] token getBalance incorrect');
    });
  });
  describe('() default method', function () {
    // this is more verbose as we're checking for unkonw gas-deducted balances
    let gasPrice;
    let rate;
    let total;
    const minted = 25;
    before(async function () {
      gasPrice = await a.callback(web3.eth.getGasPrice);
      token = await EtcRedemptionToken.new({ from: accounts[0] });
      rate = await token.rate.call();
      total = rate.mul(minted);
      await token.fund({ value: total, from: accounts[0] });
      assert.equal(await a.callback(web3.eth.getBalance, token.address), total.toNumber());
      await token.mint(accounts[4], minted, { from: accounts[0] });
      await token.setActivationBlock(1, { from: accounts[0] });
    });
    async function testThrowAndBalance({ value, from }) {
      const beforeContractBalance = await a.callback(web3.eth.getBalance, token.address);
      const beforeUserBalance = await a.callback(web3.eth.getBalance, from);
      const minDiff = 1;
      const maxDiff = gasPrice * 71951; // cost of tx
      await assertThrow(() => a.callback(web3.eth.sendTransaction, { to: token.address, from, value, gas: 500000 }));
      const afterBalance = await a.callback(web3.eth.getBalance, from);
      const balanceDiff = beforeUserBalance.minus(afterBalance).toNumber();
      assert.ok(balanceDiff > minDiff && balanceDiff < maxDiff, 'balance not within gas expectations');
      assert.equal(await a.callback(web3.eth.getBalance, token.address), beforeContractBalance.toNumber());
    }
    it('throws if sent with a value transaction', async function () {
      await testThrowAndBalance({ value: 50, from: accounts[4], gas: 500000, gasPrice });
    });
    it('throws if user has zero balance', async function () {
      await testThrowAndBalance({ from: accounts[0], gas: 500000, gasPrice });
    });
    it('succeeds when user has enough balance', async function () {
      const beforeContractBalance = await a.callback(web3.eth.getBalance, token.address);
      const beforeUserBalance = await a.callback(web3.eth.getBalance, accounts[4]);
      const tx = await a.callback(web3.eth.sendTransaction, { to: token.address, from: accounts[4], gas: 500000, gasPrice });
      const { gasUsed } = await a.callback(web3.eth.getTransactionReceipt, tx);
      // contract should have exactly less than the amount...
      assert.equal(await a.callback(web3.eth.getBalance, token.address), beforeContractBalance.sub(rate.mul(minted)).toNumber());
      // calculate user's balance
      const afterUserBalance = await a.callback(web3.eth.getBalance, accounts[4]);
      const expectedAfterBalance = beforeUserBalance.add(rate.mul(minted)).sub(gasPrice.times(gasUsed));
      assert.equal(expectedAfterBalance, afterUserBalance.toString(10));
      // confirm getter values correct
      assert.equal(await token.balanceOf.call(accounts[4]), 0);
      assert.equal(await token.redeemedOf.call(accounts[4]), minted);
      assert.equal(await token.totalTokensRedeemed.call(), minted);
      assert.equal(await token.totalWeiRedeemed.call(), rate.mul(minted).toString(10));
      assert.equal(await token.totalSupply.call(), 0);
    });
  });
  describe('redeem with external contract', function () {
    function testSuite(Throwable, name) {
      return it(`throws when redeeming with with a contract (${name})`, async function () {
        const throwable = await Throwable.new();
        token = await EtcRedemptionToken.new({ from: accounts[0] });
        await token.fund({ value: 1000, from: accounts[0] });
        await token.setRate(1, { from: accounts[0] });
        await token.mint(accounts[0], 100, { from: accounts[0] });
        await token.setActivationBlock(1, { from: accounts[0] });
        assert.equal((await token.totalSupply.call()).toNumber(), 100);
        assert.equal((await token.balanceOf(accounts[0])).toNumber(), 100);
        assert.equal((await a.callback(web3.eth.getBalance, throwable.address)).toNumber(), 0);
        assert.equal((await a.callback(web3.eth.getBalance, token.address)).toNumber(), 1000);
        await assertThrow(() => token.redeem(throwable.address, { from: accounts[0] }));
        assert.equal((await token.balanceOf(accounts[0])).toNumber(), 100);
        assert.equal((await a.callback(web3.eth.getBalance, throwable.address)).toNumber(), 0);
        assert.equal((await a.callback(web3.eth.getBalance, token.address)).toNumber(), 1000);
      });
    }
    testSuite(MockThrowableA, 'A');
    testSuite(MockThrowableB, 'B');
    testSuite(MockThrowableC, 'C');
    testSuite(MockThrowableD, 'D');
  });
});
