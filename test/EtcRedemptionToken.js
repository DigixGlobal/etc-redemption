const a = require('awaiting');
const { randomAddress, assertThrow } = require('./helpers');

const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');

const defaultRate = 1000000;

contract('EtcRedemptionToken', function (accounts) {
  let token;
  describe('init', function () {
    it('initializes with the correct values', async function () {
      token = await EtcRedemptionToken.new();
      assert.equal(await token.totalTokensRedeemed.call(), 0);
      assert.equal(await token.totalWeiRedeemed.call(), 0);
      assert.equal(await token.rate.call(), defaultRate);
    });
  });
  describe('fund', function () {
    it('allows funding', async function () {
      await token.fund({ value: 10 });
      assert.equal(await a.callback(web3.eth.getBalance, token.address), 10);
    });
  });
  describe('rate', function () {
    it('allows admins to set the rate', async function () {
      await token.setRate(defaultRate - 20, { from: accounts[0] });
      assert.equal(await token.rate.call(), defaultRate - 20);
      await token.setRate(defaultRate, { from: accounts[0] });
      assert.equal(await token.rate.call(), defaultRate);
    });
    it('prevents non-admins from setting the rate', async function () {
      await assertThrow(() => token.setRate(defaultRate - 20, { from: accounts[1] }));
      assert.equal(await token.rate.call(), defaultRate);
    });
  });
  describe('redeem', function () {
    const testReceivingAccount = randomAddress();
    before(async function () {
      token = await EtcRedemptionToken.new(); // redeploy
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
      assert.equal(await token.totalTokensRedeemed.call(), 50);
      assert.equal(await token.totalSupply.call(), 1005);
    });
    it('throws when redeeming to a null address', async function () {
      token = await EtcRedemptionToken.new(); // redeploy
      await token.setActivationBlock(1);
      await token.fund({ value: 1 });
      await token.mint(accounts[0], 1);
      await assertThrow(() => token.redeem('0x000000000000000000000000000000000000000'));
      await token.redeem(accounts[0]);
      assert.equal(await token.redeemedOf.call(accounts[0]), 1);
    });
    it('redeems the correct amount based on the rate', async function () {
      token = await EtcRedemptionToken.new(); // redeploy
      const testAccounts = [randomAddress(), randomAddress(), randomAddress()];
      const initialBalances = [defaultRate, web3.toBigNumber(1e18 / 2), 1337];
      const rates = [defaultRate * 2, Math.floor(defaultRate * 1.11), defaultRate * 10];
      const expectedWei = [initialBalances[0] / 2, initialBalances[1].dividedBy(1.11).floor(), Math.floor(initialBalances[2] / 10)];
      // start with enough
      await token.setActivationBlock(1);
      await token.fund({ value: 1e18 });
      // set the accounts
      await token.mint(accounts[0], initialBalances[0]);
      await token.mint(accounts[1], initialBalances[1]);
      await token.mint(accounts[2], initialBalances[2]);
      // test 1
      await token.setRate(rates[0]);
      await token.redeem(testAccounts[0], { from: accounts[0] });
      assert.equal(await token.balanceOf.call(accounts[0]), 0, '[0] balanceOf incorrect');
      assert.equal(await token.redeemedOf.call(accounts[0]), initialBalances[0], '[0] redeemedOf incorrect');
      assert.equal(await token.totalTokensRedeemed.call(), initialBalances[0], '[0] totalTokensRedeemed incorrect');
      assert.equal(await token.totalWeiRedeemed.call(), expectedWei[0], '[0] totalWeiRedeemed incorrect');
      assert.equal(await token.totalSupply.call(), initialBalances[1].add(initialBalances[2]).toNumber(), '[0] totalSupply incorrect');
      assert.equal(await a.callback(web3.eth.getBalance, testAccounts[0]), expectedWei[0], '[0] getBalance incorrect');
      // test 2
      await token.setRate(rates[1]);
      await token.redeem(testAccounts[1], { from: accounts[1] });
      assert.equal(await token.balanceOf.call(accounts[1]), 0, '[1] balanceOf incorrect');
      assert.equal(await token.redeemedOf.call(accounts[1]), initialBalances[1].toNumber(), '[1] redeemedOf incorrect');
      assert.equal(await token.totalTokensRedeemed.call(), initialBalances[1].add(initialBalances[0]).toNumber(), '[1] totalTokensRedeemed incorrect');
      assert.equal(await token.totalWeiRedeemed.call(), expectedWei[1].add(expectedWei[0]).toNumber(), '[1] totalWeiRedeemed incorrect');
      assert.equal(await token.totalSupply.call(), initialBalances[2], '[1] totalSupply incorrect');
      assert.equal(await a.callback(web3.eth.getBalance, testAccounts[1]), expectedWei[1].toNumber(), '[1] getBalance incorrect');
      // rate 3
      await token.setRate(rates[2]);
      await token.redeem(testAccounts[2], { from: accounts[2] });
      assert.equal(await token.balanceOf.call(accounts[2]), 0, '[2] balanceOf incorrect');
      assert.equal(await token.redeemedOf.call(accounts[2]), initialBalances[2], '[2] redeemedOf incorrect');
      assert.equal(await token.totalTokensRedeemed.call(), initialBalances[1].add(initialBalances[0]).add(initialBalances[2]).toNumber(), '[2] totalTokensRedeemed incorrect');
      assert.equal(await token.totalWeiRedeemed.call(), expectedWei[1].add(expectedWei[0]).add(expectedWei[2]).toNumber(), '[2] totalWeiRedeemed incorrect');
      assert.equal(await token.totalSupply.call(), 0, '[2] totalSupply incorrect');
      assert.equal(await a.callback(web3.eth.getBalance, testAccounts[2]), expectedWei[2], '[2] getBalance incorrect');
    });
  });
  describe('() default method', function () {
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
      await assertThrow(() => a.callback(web3.eth.sendTransaction, { to: token.address, from, value, gas: 3000000 }));
      const afterBalance = await a.callback(web3.eth.getBalance, from);
      const balanceDiff = beforeUserBalance.minus(afterBalance).toNumber();
      assert.ok(balanceDiff > minDiff && balanceDiff < maxDiff, 'balance not within gas expectations');
      assert.equal(await a.callback(web3.eth.getBalance, token.address), beforeContractBalance.toNumber());
    }
    it('throws if sent with a value transaction', async function () {
      await testThrowAndBalance({ value: minted + 50, from: accounts[4], gas: 3000000 });
    });
    it('throws if user has zero balance', async function () {
      await testThrowAndBalance({ from: accounts[0] });
    });
    it('succeeds when user has enough balance', async function () {
      const beforeContractBalance = await a.callback(web3.eth.getBalance, token.address);
      const gasEstimate = await a.callback(web3.eth.estimateGas, { to: token.address, from: accounts[4] });
      const beforeUserBalance = await a.callback(web3.eth.getBalance, accounts[4]);
      await a.callback(web3.eth.sendTransaction, { to: token.address, from: accounts[4], gas: gasEstimate * 1.5 });
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
      assert.equal(await token.totalTokensRedeemed.call(), minted.toNumber());
      assert.equal(await token.totalSupply.call(), 0);
    });
    // withdraws the correct amount based on rate
  });
});
