const getContract = require('./contract');
const eachLimit = require('../node_modules/async/eachLimit');

function confirmBalances({ data, token }) {
  return new Promise((resolve) => {
    let i = 0;
    const addresses = Object.keys(data.balances);
    eachLimit(addresses, 32, function (address, cb) {
      const { etcWei } = data.balances[address];
      token.balanceOf.call(address).then((balance) => {
        i += 1;
        const match = etcWei === balance.toString(10);
        if (!match) { throw new Error('Balance mismatch!'); }
        console.log(`${address} ${etcWei} ${i} / ${addresses.length} `);
        cb();
      });
    }, resolve);
  });
}

module.exports = async function () {
  const { data, token } = await getContract(artifacts);
  try {
    await confirmBalances({ data, token });
    console.log('confirmed!');
  } catch (e) {
    console.log('there was an error!');
  }
};
