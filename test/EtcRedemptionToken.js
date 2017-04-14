const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');

const testAccount = '0x000000000000000000000000000000000000001';

contract('EtcRedemptionToken', function (accounts) {
  it('should have the correct initialization values', async function () {
    const contract = await EtcRedemptionToken.deployed();
    assert.equal(await contract.admin.call(), accounts[0]);
    assert.equal(await contract.active.call(), false);
    assert.equal(await contract.totalSupply.call(), 0);
    assert.equal(await contract.totalRedeemed.call(), 0);
  });

  it('should mint', async function () {
    const contract = await EtcRedemptionToken.deployed();
    await contract.mint(testAccount, 20);
    assert.equal((await contract.balanceOf(testAccount)).toNumber(), 20);
    await contract.mint(testAccount, 10);
    assert.equal((await contract.balanceOf(testAccount)).toNumber(), 10);
  });
});
