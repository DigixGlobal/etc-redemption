const { assertThrow } = require('./helpers');
const a = require('awaiting');

const Permissioned = artifacts.require('MockPermissioned');

contract('Permissioned', function (accounts) {
  let permissioned;
  describe('init', function () {
    it('admin initializes with deployer address', async function () {
      permissioned = await Permissioned.new({ from: accounts[0] });
      assert.equal(await permissioned.admin.call(), accounts[0]);
    });
  });
  describe('transferAdmin', function () {
    it('allows transferring of admin if sender is default admin', async function () {
      await permissioned.transferAdmin(accounts[1], { from: accounts[0] });
      assert.equal(await permissioned.admin.call(), accounts[1]);
    });
    it('prevents transferring if sender is non-admin', async function () {
      await assertThrow(() => permissioned.transferAdmin(accounts[0], { from: accounts[0] }));
    });
    it('allows transferring of admin is sender is the new admin', async function () {
      await permissioned.transferAdmin(accounts[0], { from: accounts[1] });
      assert.equal(await permissioned.admin.call(), accounts[0]);
    });
  });
  describe('seppuku', function () {
    it('allows suicide by admins', async function () {
      const beforeCode = await a.callback(web3.eth.getCode, permissioned.address);
      assert(beforeCode.length > 64, 'beforecode too short');
      await permissioned.seppuku();
      assert.equal(await a.callback(web3.eth.getCode, permissioned.address), '0x0');
    });
    it('prevents suicide by non-admins', async function () {
      permissioned = await Permissioned.new({ from: accounts[0] });
      const beforeCode = await a.callback(web3.eth.getCode, permissioned.address);
      assert(beforeCode.length > 64, 'beforecode too short');
      await assertThrow(() => permissioned.seppuku({ from: accounts[1] }));
      assert.equal(await a.callback(web3.eth.getCode, permissioned.address), beforeCode);
    });
  });
  describe('drain', function () {
    it('allows drain by admins', async function () {
      const value = 1e18 / 1000;
      permissioned = await Permissioned.new({ from: accounts[0], value });
      const beforeBalance = await a.callback(web3.eth.getBalance, accounts[1]);
      await permissioned.drain(accounts[1]);
      const afterBalance = await a.callback(web3.eth.getBalance, accounts[1]);
      assert.equal(afterBalance.minus(beforeBalance), value);
    });
    it('prevents drain by non-admins', async function () {
      const value = 1e18 / 1000;
      permissioned = await Permissioned.new({ from: accounts[0], value });
      const beforeBalance = await a.callback(web3.eth.getBalance, accounts[1]);
      await assertThrow(() => permissioned.drain(accounts[2], { from: accounts[2] }));
      const afterBalance = await a.callback(web3.eth.getBalance, accounts[1]);
      assert.equal(afterBalance.minus(beforeBalance), 0);
    });
  });

});
