const fs = require('fs');
const eachLimit = require('../node_modules/async/eachLimit');

const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');

const scriptsDir = './scripts/data/';
const toBlock = parseInt(process.argv[process.argv.length - 1], 10);
if (!toBlock) { throw new Error('Must pass a block number'); }

function confirmBalances({ data, token }) {
  return new Promise((resolve) => {
    let i = 0;
    const mismatches = [];
    const addresses = Object.keys(data.balances);
    eachLimit(addresses, 32, function (address, cb) {
      const { combined } = data.balances[address];
      token.balanceOf.call(address).then((balance) => {
        i += 1;
        const match = parseInt(combined, 10) === balance.toNumber();
        const msg = match ? combined : `${balance.toNumber()} !== ${combined}`;
        if (!match) { mismatches.push(`${address} : ${msg}`); }
        console.log(`${match ? 'OK ✅' : 'BAD ⛔️'}  ${address} : ${i} / ${addresses.length} : ${msg}`);
        cb();
      });
    }, () => resolve(mismatches));
  });
}

module.exports = async function () {
  const token = await EtcRedemptionToken.deployed();
  const filename = fs.readdirSync(scriptsDir).filter(a => a.indexOf(`balances-${toBlock}-`) === 0)[0];
  console.log(`Confirming balances for contract ${token.address} equivalent to block ${toBlock} using: ${filename}`);
  const data = JSON.parse(fs.readFileSync(`${scriptsDir}/${filename}`));
  const mismatches = await confirmBalances({ data, token });
  if (mismatches.length) {
    return console.log(`
      ⛔️  Mismatches!
      ${JSON.stringify(mismatches, null, 2)}
      `);
  }
  return console.log('✅  No mismatches!');
};
