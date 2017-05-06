const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');
// const MultiSigWallet = artifacts.require('MultiSigWallet');

module.exports = function (deployer) {
  deployer.deploy(EtcRedemptionToken);
  // deployer.deploy(MultiSigWallet, accounts.splice(0, 4), 3);
};
