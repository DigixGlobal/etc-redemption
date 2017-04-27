const fs = require('fs');
const eachLimit = require('../node_modules/async/eachLimit');

const Token = artifacts.require('EtcRedemptionToken');

const scriptsDir = './scripts/data/';

const fromTx = !isNaN(process.argv[process.argv.length - 2]) ? parseInt(process.argv[process.argv.length - 2], 10) : 0;
const toBlock = parseInt(process.argv[process.argv.length - 1], 10);
if (!toBlock) { throw new Error('Must pass a block number'); }

function mintTokens({ data, token }) {
  return new Promise((resolve) => {
    if (fromTx) { console.log(`Resuming from tx # ${fromTx}`); }
    const transactions = [];
    let i = fromTx;
    const addresses = Object.keys(data.balances);
    eachLimit(addresses.slice(fromTx), 6, function (address, cb) {
      const { combined } = data.balances[address];
      token.mint(address, combined).then(({ receipt: { transactionHash, blockNumber } }) => {
        i += 1;
        console.log(`${address} ${transactionHash} ${combined} -- ${i} / ${addresses.length}`);
        transactions.push({
          transactionHash,
          blockNumber,
          address,
          tokens: combined,
        });
        cb();
      });
    }, () => resolve);
  });
}


module.exports = async function () {
  const token = await Token.deployed();
  const output = `transactions-${toBlock}-${new Date().getTime()}`;
  const filename = fs.readdirSync(scriptsDir).filter(a => a.indexOf(`balances-${toBlock}-`) === 0)[0];
  const data = JSON.parse(fs.readFileSync(`${scriptsDir}/${filename}`));
  console.log(`Minting balances for contract ${token.address} equivalent to block ${toBlock} using: ${filename}`);
  const txs = await mintTokens({ token, data });
  // write the report;
  fs.writeFileSync(output, JSON.stringify(txs));
  console.log(`✅  done! wrote: transactions-${toBlock}-${new Date().getTime()}`);
  // console.log(Object.keys(data.balances));
};
