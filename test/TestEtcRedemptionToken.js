const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');
const MockSafeMath = artifacts.require('MockSafeMath');

const { assertThrow, testAccounts, BIG_INT, BIG_INT_MINUS_TWO } = require('./helpers');

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
  describe('redeem', function () {
    // promisify web3...
    // you get back exactly what you have in wei..

    // redeem process..
    // totalRedeemed
    // doesn't work if we're not active
  });
});
