const fs = require('fs');
const Web3 = require('web3');

const scriptsDir = './scripts/data';

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const types = {
  DEFAULT: 'default',
  ETHERSCAN: 'etherscan',
};

const totalWei = web3.toBigNumber(465134.9598).times(1e18);
const totalDgdWei = web3.toBigNumber(2000000).times(1e9);
const rate = totalWei.dividedBy(totalDgdWei);

const toBlock = parseInt(process.argv[process.argv.length - 1], 10);
if (!toBlock) { throw new Error('Must pass a block number'); }

function getData(name) {
  const data = JSON.parse(fs.readFileSync(`${scriptsDir}/${name}`));
  // console.log('data', data);
  // detect the data type...
  const type = data.unclaimedDgdWei ? types.DEFAULT : types.ETHERSCAN;
  if (type === types.DEFAULT) {
    return Object.keys(data.balances).reduce((o, key) => {
      const { etcWei } = data.balances[key];
      return Object.assign({}, o, { [key]: etcWei });
    }, {});
  }
  if (type === types.ETHERSCAN) {
    return Object.keys(data.items).reduce((o, key) => {
      // convert to DGD to wei value
      const etcWei = rate.times(data.items[key]).times(1e9).toString(10);
      return Object.assign({}, o, { [key]: etcWei });
    }, {});
  }
  // sanitize
  return data;
}

function areEqualShallow(a, b) {
  for (let key in a) {
    if (!(key in b) || a[key] !== b[key]) {
      return false;
    }
  }
  for (let key in b) {
    if (!(key in a) || a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}


(function () {
  const filenames = fs.readdirSync(scriptsDir).filter(a => a.indexOf(`balances-${toBlock}-`) === 0);
  process.stdout.write(`
    comparing ${filenames.length} reports
    ${filenames.join('\n    ')}
  `);
  const dataSet = filenames.map(name => getData(name));
  const validated = dataSet.filter((d, i) => (i === 0 ? true : areEqualShallow(d, dataSet[i - 1])));
  const target = 465135;
  const total = Math.round(Object.values(validated[0]).reduce((o, n) => o + parseInt(n, 10), 0) / 1e18);
  const diff = total - target;
  const percentage = ((total / target) * 100).toFixed(2);
  if (validated.length === dataSet.length) {
    process.stdout.write(`
    ✅  Success! ${validated.length} reports are identical, with ${Math.round(total)} (${percentage}%, ${diff}) total DGD accounted for.
`);
  } else {
    process.stdout.write(`
    ⛔️  Failure! ${validated.length} reports are NOT all identical
`);
  }
}());
