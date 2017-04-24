const { assertThrow } = require('./helpers');

const Permissioned = artifacts.require('Permissioned');

contract('Permissioned', function (accounts) {
  let permissioned;
  it('admin initializes with deployer address', async function () {
    permissioned = await Permissioned.new({ from: accounts[0] });
    assert.equal(await permissioned.admin.call(), accounts[0]);
  });
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
  // TODO drain, suppuku only admin
});
