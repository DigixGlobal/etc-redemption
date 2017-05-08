const fs = require('fs');
const eachLimit = require('../node_modules/async/eachLimit');
const { minimumDgdWei, scriptsDir, toBlock } = require('./helpers/config');

const Token = artifacts.require('EtcRedemptionToken');

const fromTx = !isNaN(process.argv[process.argv.length - 1]) ? parseInt(process.argv[process.argv.length - 1], 10) : 0;

const transactions = [];

function mintTokens({ data, token }) {
  return new Promise((resolve) => {
    if (fromTx) { console.log(`Resuming from tx # ${fromTx}`); }
    let i = fromTx;
    const addresses = Object.keys(data.balances);
    eachLimit(addresses.slice(fromTx), 32, function (address, cb) {
      i += 1;
      const j = i;
      function mint() {
        const { combined } = data.balances[address];
        if (combined < minimumDgdWei) {
          console.log(`${address} SKIPPED ${combined} -- ${j} / ${addresses.length}`);
          cb();
        } else {
          token.mint(address, combined).then(({ receipt: { transactionHash, blockNumber } }) => {
            console.log(`${address} ${transactionHash} ${combined} -- ${j} / ${addresses.length}`);
            transactions.push({
              transactionHash,
              blockNumber,
              address,
              tokens: combined,
            });
            cb();
          }).catch((e) => {
            console.log(e, 'retrying...', i);
            mint();
          });
        }
      }
      mint();
    }, resolve);
  });
}


module.exports = async function () {
  const token = await Token.deployed();
  const output = `${scriptsDir}/transactions-${toBlock}-${new Date().getTime()}.json`;
  const filename = fs.readdirSync(scriptsDir).filter(a => a.indexOf(`balances-${toBlock}-`) === 0)[0];
  const data = JSON.parse(fs.readFileSync(`${scriptsDir}/${filename}`));
  // write the report on exit, catching errors
  let written = false;
  function exitHandler() {
    if (!written) {
      written = true;
      fs.writeFileSync(output, JSON.stringify(transactions));
      console.log(`wrote: ${output}`);
      process.exit();
    }
  }
  process.on('exit', exitHandler);
  process.on('SIGINT', exitHandler);
  process.on('uncaughtException', exitHandler);
  // execute the minting
  console.log(`Minting balances for contract ${token.address} equivalent to block ${toBlock} using: ${filename}`);
  await mintTokens({ token, data });
};
