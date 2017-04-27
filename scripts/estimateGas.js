const a = require('../node_modules/awaiting');

const Token = artifacts.require('EtcRedemptionToken');

const userCount = 2000;

module.exports = async function () {
  console.log('Fetching...');
  const token = Token.at('0x0000000000000000000000000000000000000000');
  const steps = {
    deploy: await a.callback(web3.eth.estimateGas, { data: Token.binary }),
    mint: await a.callback(token.contract.mint.estimateGas, '0x000000000000000000000000000000000000000', 1e18 * 5000) * userCount,
    activationBlock: await a.callback(token.contract.setActivationBlock.estimateGas, 4000000),
    transferAdmin: await a.callback(token.contract.transferAdmin.estimateGas, '0x000000000000000000000000000000000000000'),
  };
  const gasPrice = (await a.callback(web3.eth.getGasPrice)).toNumber();
  const totalGas = Object.values(steps).reduce((o, n) => o + n, 0);
  const totalWei = totalGas * gasPrice;
  const totalEth = totalWei / 1e18;
  console.log(JSON.stringify({ totalGas, totalWei, totalEth, gasPrice, steps }, null, 2));
};
