const a = require('awaiting');

const { assertThrow } = require('./helpers');

const MockTimeLockable = artifacts.require('MockTimeLockable');

contract('TimeLockable', function (accounts) {
  let timeLockable;
  describe('init', function () {
    it('activationBlock initializes with 0', async function () {
      timeLockable = await MockTimeLockable.new({ from: accounts[0] });
      assert.equal(await timeLockable.activationBlock.call(), 0);
    });
  });
  describe('setActivationBlock', function () {
    it('sets the active block', async function () {
      await timeLockable.setActivationBlock(1, { from: accounts[0] });
      assert.equal(await timeLockable.activationBlock.call(), 1);
      await timeLockable.setActivationBlock(123123, { from: accounts[0] });
      assert.equal(await timeLockable.activationBlock.call(), 123123);
      await timeLockable.setActivationBlock(0, { from: accounts[0] });
      assert.equal(await timeLockable.activationBlock.call(), 0);
      await timeLockable.setActivationBlock(99999999999999, { from: accounts[0] });
      assert.equal(await timeLockable.activationBlock.call(), 99999999999999);
    });
    it('throws when setting from non-admin', async function () {
      await assertThrow(() => timeLockable.setActivationBlock(1, { from: accounts[1] }));
      assert.equal(await timeLockable.activationBlock.call(), 99999999999999);
    });
  });
  describe('isActvie', function () {
    it('throws when set activationBlock is 0', async function () {
      await timeLockable.setActivationBlock(0, { from: accounts[0] });
      await assertThrow(() => timeLockable.testIsActive.call());
    });
    it('throws when set activationBlock is > current block', async function () {
      const thisBlock = await a.callback(web3.eth.getBlockNumber);
      await timeLockable.setActivationBlock(thisBlock + 10, { from: accounts[0] });
      await assertThrow(() => timeLockable.testIsActive.call());
    });
    it('is true when activation block is is between 1 and currentBlock', async function () {
      await timeLockable.setActivationBlock(1, { from: accounts[0] });
      assert.equal(await timeLockable.testIsActive.call(), true);
      const thisBlock = await a.callback(web3.eth.getBlockNumber);
      await timeLockable.setActivationBlock(thisBlock, { from: accounts[0] });
      assert.equal(await timeLockable.testIsActive.call(), true);
      await timeLockable.setActivationBlock(thisBlock - 1, { from: accounts[0] });
      assert.equal(await timeLockable.testIsActive.call(), true);
    });
  });
});
