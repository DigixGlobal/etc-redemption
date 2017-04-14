var EtcRedemptionToken = artifacts.require("./EtcRedemptionToken.sol");

module.exports = function(deployer) {
  deployer.deploy(EtcRedemptionToken);
};
