const MockSafeMath = artifacts.require('MockSafeMath');

module.exports = function (deployer, network) {
  if (network === 'development') {
    deployer.deploy(MockSafeMath);
  }
};
