const fs = require('fs');
const a = require('../node_modules/awaiting');
const eachLimit = require('../node_modules/async/eachLimit');
const getEvents = require('./helpers/getEvents');
const { minimumDgdWei, scriptsDir, toBlock } = require('./helpers/config');

const EtcRedemptionToken = artifacts.require('EtcRedemptionToken');

function confirmBalances({ balances, token }) {
  return new Promise((resolve) => {
    let i = 0;
    const mismatches = [];
    const addresses = Object.keys(balances);
    eachLimit(addresses, 16, function (address, cb) {
      const { combined } = balances[address];
      i += 1;
      const j = i;
      function check() {
        token.balanceOf.call(address).then((balance) => {
          const match = parseInt(combined, 10) === balance.toNumber();
          const msg = match ? combined : `${balance.toNumber()} !== ${combined}`;
          if (!match) { mismatches.push(`${address} : ${msg}`); }
          console.log(`${match ? 'OK ✅' : 'BAD ⛔️'}  ${address} : ${j} / ${addresses.length} : ${msg}`);
          cb();
        }).catch((e) => {
          console.log(e, 'retrying...', i);
          check();
        });
      }
      check();
    }, () => resolve(mismatches));
  });
}

module.exports = async function () {
  const token = await EtcRedemptionToken.deployed();
  const filename = fs.readdirSync(scriptsDir).filter(a => a.indexOf(`balances-${toBlock}-`) === 0)[0];
  console.log(`Confirming balances for contract ${token.address} equivalent to block ${toBlock} using: ${filename}`);
  const data = JSON.parse(fs.readFileSync(`${scriptsDir}/${filename}`));
  // filter smaller balances
  const balances = Object.keys(data.balances).reduce((o, k) => {
    if (data.balances[k].combined < minimumDgdWei) { return o; }
    return Object.assign(o, { [k]: data.balances[k] });
  }, {});
  const thisBlock = await (a.callback(web3.eth.getBlockNumber));
  const events = await getEvents(token.Mint, 'Mint', { fromBlock: 0, toBlock: thisBlock });
  // reduce events into addresses, compare lengths
  const addresses = events.reduce((o, { args }) => Object.assign(o, { [args.to]: true }), {});
  const aL = Object.keys(addresses).length;
  const bL = Object.keys(balances).length;
  if (aL !== bL) {
    return console.log(`
      ⛔️  ${aL} events !== ${bL} balances!
      `);
  }
  const mismatches = await confirmBalances({ balances, token });
  if (mismatches.length) {
    return console.log(`
      ⛔️  Mismatches!
      ${JSON.stringify(mismatches, null, 2)}
      `);
  }
  return console.log(`✅  No mismatches, ${bL} addresses!`);
};
