const { etcPool, dgdPool } = require('./helpers/config.json');
const Web3 = require('web3');

const { toBigNumber } = new Web3();

const dgdWei = toBigNumber(dgdPool).mul(1e9);
const wei = toBigNumber(etcPool).mul(1e18);
const rate = wei.dividedBy(dgdWei);

console.log({
  dgdWei,
  wei,
  rate: rate.toString(10),
});

module.exports = rate;
