/* eslint-disable no-underscore-dangle, max-len */
const fs = require('fs');
const Web3 = require('web3');
const abis = require('./abis');
const eachLimit = require('async/eachLimit');

const toBlock = parseInt(process.argv[process.argv.length - 1], 10);

if (!toBlock) {
  throw new Error('Must pass a block number');
}

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const token = web3.eth.contract(abis.token).at('0xE0B7927c4aF23765Cb51314A0E0521A9645F0E2A');
const crowdsale = web3.eth.contract(abis.crowdsale).at('0xF0160428a8552AC9bB7E050D90eEADE4DDD52843');

const totalWei = web3.toBigNumber(465134.9598).times(1e18);
const totalDgdWei = web3.toBigNumber(2000000).times(1e9);
const rate = totalWei.dividedBy(totalDgdWei);

function getCrowdsaleBalances() {
  process.stdout.write('getting crowdsale balances...\n');
  const balances = {};
  let i = 0;
  return new Promise((resolve) => {
    // TODO also check proxy address
    crowdsale.Purchase({}, { fromBlock: 1239208, toBlock }).get((err, purchases) => {
      eachLimit(purchases, 50, ({ transactionHash }, eachCallback) => {
        i += 1;
        process.stdout.write(` ${i}/${purchases.length}     \r`);
        web3.eth.getTransaction(transactionHash, (err1, tx) => {
          balances[tx.from] = {};
          crowdsale.userInfo.call(tx.from, toBlock, (err2, userInfo) => {
            const claimed = userInfo[4];
            if (!claimed && userInfo[2].toNumber()) {
              balances[tx.from].unclaimed = userInfo[2];
            }
            token.balanceOf.call(tx.from, toBlock, (err3, balanceOf) => {
              if (balanceOf.toNumber()) {
                balances[tx.from].dgds = balanceOf;
              }
              eachCallback();
            });
          });
        });
      }, () => { resolve(balances); });
    });
  });
}

function getTransferBalances({ crowdsaleBalances }) {
  process.stdout.write('getting transfered balances...\n');
  const balances = {};
  let i = 0;
  return new Promise((resolve) => {
    crowdsale.Claim({}, { fromBlock: 1239208, toBlock }).get((err, claims) => {
      token.Transfer({}, { fromBlock: 1409121, toBlock }).get((err2, transfers) => {
        const users = {};
        Object.values(claims).forEach(({ args }) => { users[args._user] = true; });
        Object.values(transfers).forEach(({ args }) => { users[args._to] = true; });
        eachLimit(Object.keys(users), 100, (user, eachCallback) => {
          i += 1;
          process.stdout.write(` ${i}/${transfers.length}     \r`);
          // check if it's a contract....
          web3.eth.getCode(user, (err3, res) => {
            const contract = res !== '0x';
            // no need to check balance if we have already checked it
            if (crowdsaleBalances[user]) {
              return eachCallback();
            }
            return token.balanceOf.call(user, toBlock, (err4, balanceOf) => {
              if (balanceOf.toNumber()) {
                balances[user] = { dgds: balanceOf, contract };
              }
              eachCallback();
            });
          });
        }, () => resolve(balances));
      });
    });
  });
}


(async function () {
  let totalUnclaimed;
  let totalDgds;
  const serialized = {};
  const contracts = {};
  const created = new Date().getTime();

  // fetch
  const crowdsaleBalances = await getCrowdsaleBalances();
  const balances = await getTransferBalances({ crowdsaleBalances });

  // merge
  Object.keys(crowdsaleBalances).forEach((k) => {
    const { dgds, unclaimed } = crowdsaleBalances[k];
    if (dgds || unclaimed) {
      balances[k] = Object.assign({}, balances[k], { dgds, unclaimed });
    }
  });

  // add up
  Object.keys(balances).forEach((k) => {
    const { contract, dgds, unclaimed } = balances[k];
    totalDgds = dgds ? ((totalDgds && totalDgds.add(dgds)) || dgds) : totalDgds;
    totalUnclaimed = unclaimed ? ((totalUnclaimed && totalUnclaimed.add(unclaimed)) || unclaimed) : totalUnclaimed;
    balances[k].combined = (dgds ? dgds.add(unclaimed || 0) : unclaimed);
    const wei = balances[k].combined.times(rate).floor();
    const data = {
      dgdWei: balances[k].combined.toString(10),
      dgd: balances[k].combined.dividedBy(1e9).toString(10),
      etcWei: wei.toString(10),
      etc: wei.dividedBy(1e18).toString(10),
    };
    if (contract) {
      contracts[k] = data;
    }
    serialized[k] = data;
  });

  // grand total
  const total = (totalDgds && totalDgds.add(totalUnclaimed || 0)) || totalUnclaimed;
  const contractCount = Object.keys(contracts).length;
  // write the fle
  fs.writeFileSync(`./scripts/balances-${toBlock}.json`, JSON.stringify({
    toBlock,
    created,
    rate,
    contractCount,
    targetTotalWei: totalWei.toString(10),
    targetTotalDgdWei: totalDgdWei.toString(10),
    totalDgdWei: total.toString(10),
    unclaimedDgdWei: totalUnclaimed.toString(10),
    balances: serialized,
    contracts,
  }));
  // next step, do the things...
  console.log(`done! total: ${total / 1e9} target: ${totalDgdWei / 1e9} diff: ${(totalDgdWei - total) / 1e9} contracts: ${contractCount}`);
}());
