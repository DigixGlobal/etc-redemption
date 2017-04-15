const fs = require('fs');

const toBlock = parseInt(process.argv[process.argv.length - 1], 10);
if (!toBlock) { throw new Error('Must pass a block number'); }
const data = JSON.parse(fs.readFileSync(`${process.env.PWD}/scripts/balances-${toBlock}.json`));

module.exports = function (artifacts) {
  return new Promise((resolve) => {
    artifacts.require('EtcRedemptionToken').deployed().then((token) => {
      resolve({ data, token, toBlock });
    });
  });
};
