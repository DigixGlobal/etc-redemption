const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');

module.exports = function (deployer) {
  deployer.deploy(EtcRedemptionToken);
};
