const { etcPool, dgdPool } = require('./helpers/config.json');
const Web3 = require('web3');

const { toBigNumber } = new Web3();

const dgdWei = toBigNumber(dgdPool).shift(9);
const wei = toBigNumber(etcPool).shift(18);
const rate = wei.dividedBy(dgdWei);

console.log({
  dgdWei,
  wei,
  rate: rate.toString(10),
});

module.exports = rate;
