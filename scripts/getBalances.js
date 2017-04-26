/* eslint-disable no-underscore-dangle, max-len */
const fs = require('fs');
const Web3 = require('web3');
const eachLimit = require('async/eachLimit');

const abis = require('./data/abis');
const provider = require('./helpers/provider');

const maxBatch = 1000;
const toBlock = parseInt(process.argv[process.argv.length - 1], 10);
// etherscan test: 3,575,643

if (!toBlock) {
  throw new Error('Must pass a block number');
}

// const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io'));
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
// const web3 = new Web3(provider);
const token = web3.eth.contract(abis.token).at('0xE0B7927c4aF23765Cb51314A0E0521A9645F0E2A');
const crowdsale = web3.eth.contract(abis.crowdsale).at('0xF0160428a8552AC9bB7E050D90eEADE4DDD52843');

const totalWei = web3.toBigNumber(465134.9598).times(1e18);
const totalDgdWei = web3.toBigNumber(2000000).times(1e9);
const rate = totalWei.dividedBy(totalDgdWei);


function getEvents(method, name, args, cb) {
  // TODO split based on toBlock, aim for a batch of 20 requests?
  const totalSpan = args.toBlock - args.fromBlock;
  const batchCount = Math.ceil(totalSpan / maxBatch);
  const batches = new Array(batchCount).fill().map((n, i) => {
    const start = args.fromBlock + (maxBatch * i);
    const overlappingEnd = (start + maxBatch) - 1;
    const end = overlappingEnd > args.toBlock ? args.toBlock : overlappingEnd;
    return { fromBlock: start, toBlock: end, i };
  });
  const eventBatches = new Array(batches.length);
  process.stdout.write(`  scanning ${totalSpan} blocks for ${name} events...\r`);
  let total = 0;
  let processed = 0;
  eachLimit(batches, 4, (args2, eachCallback) => {
    method({}, { fromBlock: args2.fromBlock, toBlock: args2.toBlock }).get((err, res) => {
      processed += 1;
      total += res.length;
      process.stdout.write(`  scanning ${totalSpan} blocks for ${name} events... ${total} events, ${(Math.round((processed / batches.length) * 100))}%\r`);
      eventBatches[args2.i] = res;
      eachCallback();
    });
  }, () => {
    process.stdout.write('\n');
    const combined = eventBatches.reduce((o, b) => o.concat(b), []);
    cb(null, combined);
  });
}

function getCrowdsaleBalances() {
  process.stdout.write('\nGetting crowdsale balances: \n');
  const balances = {};
  return new Promise((resolve) => {
    let i = 0;
    // TODO also check proxy address
    getEvents(crowdsale.Purchase.bind(crowdsale), 'Purchase', { fromBlock: 1239208, toBlock: 1374207 }, (err, purchases) => {
      // TODO check user Info for the `to, rather than from`
      eachLimit(purchases, 4, (purchase, eachCallback) => {
        i += 1;
        // console.log(purchase)
        const { transactionHash } = purchase;
        // get the input data...
        web3.eth.getTransaction(transactionHash, (err1, tx) => {
          balances[tx.from] = {};
          crowdsale.userInfo.call(tx.from, toBlock, (err2, userInfo) => {
            const claimed = userInfo[4];
            if (!claimed && userInfo[2].toNumber()) {
              balances[tx.from].unclaimed = userInfo[2];
            }
            token.balanceOf.call(tx.from, toBlock, (err3, balanceOf) => {
              if (balanceOf && balanceOf.toNumber()) {
                balances[tx.from].dgds = balanceOf;
              }
              process.stdout.write(`  getting crowdsale balance info... ${Math.round((i / purchases.length) * 100)}%\r`);
              eachCallback();
            });
          });
        });
      }, () => {
        process.stdout.write('\n');
        resolve(balances);
      });
    });
  });
}

function getTransferBalances({ crowdsaleBalances }) {
  process.stdout.write('\nGetting Claimed and Transferred balances: \n');
  const balances = {};
  let i = 0;
  return new Promise((resolve) => {
    getEvents(crowdsale.Claim, 'Claim', { fromBlock: 1239208, toBlock }, (err, claims) => {
      getEvents(token.Transfer, 'Transfer', { fromBlock: 1409121, toBlock }, (err2, transfers) => {
        const users = {};
        Object.values(claims).forEach(({ args }) => { users[args._user] = true; });
        Object.values(transfers).forEach(({ args }) => { users[args._to] = true; });
        const totalUsers = Object.keys(users).length;
        eachLimit(Object.keys(users), 4, (user, eachCallback) => {
          i += 1;
          process.stdout.write(`  getting post-crowdsale balance info... ${Math.round((i / totalUsers) * 100)}% \r`);
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
  // TODO comapre crowdsalebalances
  const balances = await getTransferBalances({ crowdsaleBalances });

  // merge
  Object.keys(crowdsaleBalances).forEach((k) => {
    const { dgds, unclaimed } = crowdsaleBalances[k];
    if (dgds || unclaimed) {
      balances[k] = Object.assign({}, balances[k], { dgds, unclaimed });
    }
  });

  // add up
  Object.keys(balances)
  .sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
  .forEach((k) => {
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
  const fileName = `./scripts/data/balances-${toBlock}-${created}.json`;
  process.stdout.write(`\n\nWriting: ${fileName}`);
  // write the fle
  fs.writeFileSync(fileName, JSON.stringify({
    toBlock,
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
  process.stdout.write(`\n\n✅  Done! total: ${total / 1e9} target: ${totalDgdWei / 1e9} diff: ${(totalDgdWei - total) / 1e9} contracts: ${contractCount}\n`);
}());
