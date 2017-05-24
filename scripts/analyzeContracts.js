console.log('hello')

const data = require('./data/balances-3670542-1494603758793.json');

const contracts = {};

console.log('balances', Object.keys(data.balances).length);

Object.keys(data.balances).forEach((k) => { contracts[data.balances[k].contract] = k; });

console.log(contracts)
console.log('contracts', Object.keys(contracts).length);
