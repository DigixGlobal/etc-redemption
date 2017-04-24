const a = require('awaiting');
const { randomAddress, assertThrow, testAccounts, BIG_INT, BIG_INT_MINUS_TWO } = require('./helpers');

const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');
const MockSafeMath = artifacts.require('MockSafeMath');

contract('EtcRedemptionToken', function (accounts) {
  let token;
  describe('init', function () {
    it('has the correct initialization values', async function () {
      token = await EtcRedemptionToken.deployed();
      assert.equal(await token.admin.call(), accounts[0]);
      assert.equal(await token.activationBlock.call(), 0);
      assert.equal(await token.totalSupply.call(), 0);
      assert.equal(await token.totalRedeemed.call(), 0);
    });
  });
  describe('safe math', function () {
    let safeMath;
    it('adds safely', async function () {
      safeMath = await MockSafeMath.deployed();
      assert.equal(await safeMath.safeAdd.call(1, 2), 3);
      assert.equal(await safeMath.safeAdd.call(100, 200), 300);
      assert.equal((await safeMath.safeAdd.call(BIG_INT_MINUS_TWO, 2)).toString(10), BIG_INT);
    });
    it('throws unsafe adds', async function () {
      await assertThrow(() => safeMath.safeAdd.call(5, -2));
      await assertThrow(() => safeMath.safeAdd.call(BIG_INT, BIG_INT));
      await assertThrow(() => safeMath.safeAdd.call(BIG_INT_MINUS_TWO, BIG_INT));
      await assertThrow(() => safeMath.safeAdd.call(BIG_INT, 2));
    });
    it('subs safely', async function () {
      assert.equal(await safeMath.safeSub.call(2, 1), 1);
      assert.equal(await safeMath.safeSub.call(600, 200), 400);
      assert.equal((await safeMath.safeSub.call(BIG_INT, 2)).toString(10), BIG_INT_MINUS_TWO);
    });
    it('thorws unsafe subs', async function () {
      await assertThrow(() => safeMath.safeSub.call(2, 3));
      await assertThrow(() => safeMath.safeSub.call(BIG_INT_MINUS_TWO, BIG_INT));
      await assertThrow(() => safeMath.safeSub.call(100, 300));
    });
  });
  describe('permissions', function () {
    it('allows transferring of admin if sender is default admin', async function () {
      await token.transferAdmin(accounts[1]);
      assert.equal(await token.admin.call(), accounts[1]);
    });
    it('prevents transferring if sender is non-admin', async function () {
      await assertThrow(() => token.transferAdmin(accounts[0]));
    });
    it('allows transferring of admin is sender is the new admin', async function () {
      await token.transferAdmin(accounts[0], { from: accounts[1] });
      assert.equal(await token.admin.call(), accounts[0]);
    });
  });
  // TODO suicide
  describe('activation block', function () {
    it('allows admins to set the active block', async function () {
      await token.setActivationBlock(1);
      assert.equal(await token.activationBlock.call(), 1);
      await token.setActivationBlock(0);
      assert.equal(await token.activationBlock.call(), 0);
    });
    it('prevents non-admins from setting the active block', async function () {
      await assertThrow(() => token.setActivationBlock(2, { from: accounts[1] }));
      assert.equal(await token.activationBlock.call(), 0);
    });
    it('throws when not active', async function () {
      await token.setActivationBlock(999999999999);
      await assertThrow(() => token.approve(accounts[1], 1));
      await token.setActivationBlock(0);
      await assertThrow(() => token.approve(accounts[1], 1));
    });
    it('does not throw when active', async function () {
      await token.setActivationBlock(1);
      await token.approve(accounts[1], 1);
      await assert.equal(await token.allowance.call(accounts[0], accounts[1]), 1);
      await token.approve(accounts[1], 0);
      await assert.equal(await token.allowance.call(accounts[0], accounts[1]), 0);
    });
    it('throws after being active', async function () {
      await token.setActivationBlock(0);
      await assertThrow(() => token.approve(accounts[1], 1));
    });
  });
  describe('minting', function () {
    it('allows minting from admin', async function () {
      await token.mint(testAccounts[0], 20);
      assert.equal(await token.balanceOf(testAccounts[0]), 20);
    });
    it('allows minting overrides from admin', async function () {
      await token.mint(testAccounts[0], 10);
      assert.equal(await token.balanceOf(testAccounts[0]), 10);
    });
    it('prevents minting from non-admin', async function () {
      await assertThrow(() => token.mint(testAccounts[0], 15, { from: accounts[1] }));
      assert.equal(await token.balanceOf(testAccounts[0]), 10);
    });
    it('sets the correct totalSupply when minting', async function () {
      await token.mint(testAccounts[0], 20);
      assert.equal(await token.totalSupply.call(), 20);
      await token.mint(testAccounts[1], 55);
      assert.equal(await token.totalSupply.call(), 75);
      await token.mint(testAccounts[0], 10);
      assert.equal(await token.totalSupply.call(), 65);
    });
  });
  describe('transfer', function () {
    it('allows transfer if sender has balance and contract is active', async function () {
      await token.setActivationBlock(1);
      await token.mint(accounts[0], 20);
      await token.mint(accounts[1], 55);
      await token.mint(accounts[2], 0);
      await token.transfer(accounts[1], 1, { from: accounts[0] });
      assert.equal(await token.balanceOf.call(accounts[0]), 19);
      assert.equal(await token.balanceOf.call(accounts[1]), 56);
      await token.transfer(accounts[0], 1, { from: accounts[1] });
      assert.equal(await token.balanceOf.call(accounts[1]), 55);
      assert.equal(await token.balanceOf.call(accounts[0]), 20);
      await token.transfer(accounts[2], 40, { from: accounts[1] });
      assert.equal(await token.balanceOf.call(accounts[1]), 15);
      assert.equal(await token.balanceOf.call(accounts[2]), 40);
      await token.transfer(accounts[0], 40, { from: accounts[2] });
      assert.equal(await token.balanceOf.call(accounts[2]), 0);
      assert.equal(await token.balanceOf.call(accounts[0]), 60);
    });
    it('prevents transfers when not active', async function () {
      await token.mint(accounts[0], 10);
      await token.mint(accounts[1], 10);
      await token.setActivationBlock(999999999999);
      await assertThrow(() => token.transfer(accounts[1], 1, { from: accounts[0] }));
      assert.equal(await token.balanceOf.call(accounts[0]), 10);
      await token.setActivationBlock(1);
      await token.transfer(accounts[1], 1, { from: accounts[0] });
      assert.equal(await token.balanceOf.call(accounts[0]), 9);
      await token.setActivationBlock(0);
      await assertThrow(() => token.transfer(accounts[1], 1, { from: accounts[0] }));
      assert.equal(await token.balanceOf.call(accounts[0]), 9);
    });
    it('prevents transfers from users without enough balance', async function () {
      await token.mint(accounts[0], 0);
      await token.mint(accounts[1], 5);
      await assertThrow(() => token.transfer(accounts[1], 1, { from: accounts[0] }));
      assert.equal(await token.balanceOf.call(accounts[0]), 0);
      assert.equal(await token.balanceOf.call(accounts[1]), 5);
    });
    // TODO approve & transferFrom
  });
  describe('fund', function () {
    it('allows funding', async function () {
      // redeploy
      token = await EtcRedemptionToken.new();
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
  describe('() default method', function () {
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

// TODO multisig
