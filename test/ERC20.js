const { assertThrow } = require('./helpers');

const ERC20 = artifacts.require('ERC20');

contract('ERC20', function (accounts) {
  let token;
  describe('init', function () {
    it('initializes with the correct values', async function () {
      token = await ERC20.new({ from: accounts[0] });
      assert.equal(await token.totalSupply.call(), 0);
    });
  });
  describe('mint', function () {
    it('sets and overrides balances for addresses', async function () {
      await token.mint(accounts[0], 302);
      assert.equal(await token.balanceOf.call(accounts[0]), 302);
      await token.mint(accounts[1], 2211121212);
      assert.equal(await token.balanceOf.call(accounts[1]), 2211121212);
      await token.mint(accounts[2], 1337);
      assert.equal(await token.balanceOf.call(accounts[2]), 1337);
      await token.mint(accounts[0], 20);
      assert.equal(await token.balanceOf.call(accounts[0]), 20);
      await token.mint(accounts[1], 55);
      assert.equal(await token.balanceOf.call(accounts[1]), 55);
      await token.mint(accounts[2], 0);
      assert.equal(await token.balanceOf.call(accounts[2]), 0);
    });
  });
  describe('transfer', function () {
    it('allows transfer if sender has balance and contract set to active', async function () {
      await token.setActivationBlock(1);
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
    // TODO approve & transferFrom, allowance
    // TODO copy other erc20 tests
  });
});
