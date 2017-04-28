const { assertThrow, BIG_INT, BIG_INT_MINUS_TWO } = require('./helpers');

const MockSafeMath = artifacts.require('MockSafeMath');

contract('SafeMath', function () {
  let safeMath;
  describe('safeAdd', function () {
    it('adds safely', async function () {
      safeMath = await MockSafeMath.new();
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
  });
  describe('safeSub', function () {
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
  describe('safeMul', function () {
    it('multiplies safely', async function () {
      const c = 2312;
      const b = 23131;
      assert.equal(await safeMath.safeMul.call(c, b), c * b);
    });
    it('throws unsafe multiplies', async function () {
      await assertThrow(() => safeMath.safeMul.call(5, -2));
      await assertThrow(() => safeMath.safeMul.call(BIG_INT, BIG_INT));
      await assertThrow(() => safeMath.safeMul.call(BIG_INT_MINUS_TWO, BIG_INT));
      await assertThrow(() => safeMath.safeMul.call(BIG_INT, 2));
    });
  });
});
