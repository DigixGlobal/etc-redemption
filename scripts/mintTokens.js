const fs = require('fs');
const getContract = require('./contract');
const eachLimit = require('../node_modules/async/eachLimit');

function mintTokens({ data, token }) {
  return new Promise((resolve) => {
    const transactions = [];
    let i = 0;
    const addresses = Object.keys(data.balances);
    eachLimit(addresses, 6, function (address, cb) {
      const { etcWei, dgd } = data.balances[address];
      token.mint(address, etcWei).then(({ receipt: { transactionHash, blockNumber } }) => {
        i += 1;
        console.log(`${address} ${transactionHash} ${etcWei} -- ${i} / ${addresses.length}`);
        transactions.push({
          transactionHash,
          blockNumber,
          address,
          etcWei,
          dgd,
        });
        cb();
      });
    }, () => resolve);
  });
}

module.exports = async function () {
  const obj = await getContract(artifacts);
  const txs = await mintTokens(obj);
  // write the report;
  fs.writeFileSync(`transactions-${obj.toBlock}-${new Date().getTime()}`, JSON.stringify(txs));
  console.log('done!');
  // console.log(Object.keys(data.balances));
};
