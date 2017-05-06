const MultiSigWallet = artifacts.require('MultiSigWallet');

module.exports = function (deployer, network, accounts) {
  deployer.deploy(MultiSigWallet, accounts.slice(0, 4), 3);
};
