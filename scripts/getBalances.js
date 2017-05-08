/* eslint-disable no-underscore-dangle, max-len */
const fs = require('fs');
const Web3 = require('web3');
const eachLimit = require('async/eachLimit');
const abis = require('./data/abis');
const getEvents = require('./helpers/getEvents');
const { scriptsDir, toBlock } = require('./helpers/config');

// const provider = require('./helpers/provider'); // if we wanted to try with infura
const provider = new Web3.providers.HttpProvider('http://localhost:8545');
// const provider = new Web3.providers.HttpProvider('https://mainnet.infura.io');

const web3 = new Web3(provider);

const token = web3.eth.contract(abis.token).at('0xE0B7927c4aF23765Cb51314A0E0521A9645F0E2A');
const crowdsale = web3.eth.contract(abis.crowdsale).at('0xF0160428a8552AC9bB7E050D90eEADE4DDD52843');

const totalDgdWei = web3.toBigNumber(2000000).times(1e9);
// const totalWei = web3.toBigNumber(465134.9598).times(1e18);
// const rate = totalWei.dividedBy(totalDgdWei);

function getBalances() {
  process.stdout.write('\nGetting Unclaimed, Claimed and Transferred balances: \n');
  const balances = {};
  let i = 0;
  return new Promise((resolve) => {
    getEvents(crowdsale.Purchase, 'Purchase', { fromBlock: 1239208, toBlock: 1374207 }, (err0, purchaseEvents) => {
      if (err0) { throw new Error(err0); }
      // get the from address of purchase
      const users = {};
      eachLimit(purchaseEvents, 16, ({ transactionHash }, cb) => {
        web3.eth.getTransaction(transactionHash, (err1, { from }) => {
          if (err1) { throw new Error(err1); }
          i += 1;
          process.stdout.write(`  getting crowdsale balance info... ${Math.round((i / purchaseEvents.length) * 100)}% \r`);
          users[from] = true;
          cb();
        });
      }, () => {
        i = 0;
        getEvents(crowdsale.Claim, 'Claim', { fromBlock: 1239208, toBlock }, (err1, claims) => {
          if (err1) { throw new Error(err1); }
          getEvents(token.Transfer, 'Transfer', { fromBlock: 1409121, toBlock }, (err2, transfers) => {
            if (err2) { throw new Error(err2); }
            Object.values(claims).forEach(({ args }) => { users[args._user.slice(0, 42)] = true; });
            Object.values(transfers).forEach(({ args }) => { users[args._to.slice(0, 42)] = true; });
            const totalUsers = Object.keys(users).length;
            eachLimit(Object.keys(users), 16, (user, eachCallback) => {
              i += 1;
              process.stdout.write(`  getting balance info... ${Math.round((i / totalUsers) * 100)}% \r`);
              web3.eth.getCode(user, (err3, res) => {
                if (err3) { throw new Error(err3); }
                const contract = res !== '0x';
                crowdsale.userInfo.call(user, toBlock, (err4, userInfo) => {
                  if (err4) { throw new Error(err4); }
                  const unclaimed = !userInfo[4] && userInfo[2].toNumber() && userInfo[2];
                  return token.balanceOf.call(user, toBlock, (err5, balanceOf) => {
                    if (err5) { throw new Error(err5); }
                    if (unclaimed || balanceOf.toNumber()) {
                      balances[user] = { dgds: balanceOf, contract };
                    }
                    if (unclaimed) {
                      balances[user].unclaimed = unclaimed;
                    }
                    eachCallback();
                  });
                });
              });
            }, () => resolve(balances));
          });
        });
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

  // const crowdsaleBalances = await getCrowdsaleBalances();
  const balances = await getBalances();

  // add up
  Object.keys(balances)
  .sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
  .forEach((k) => {
    const { contract, dgds, unclaimed } = balances[k];
    if (!dgds) { return null; }
    totalDgds = dgds ? ((totalDgds && totalDgds.add(dgds || 0)) || dgds) : totalDgds;
    totalUnclaimed = unclaimed ? ((totalUnclaimed && totalUnclaimed.add(unclaimed)) || unclaimed) : totalUnclaimed;
    const combined = dgds ? dgds.add(unclaimed || 0) : unclaimed;
    if (contract) { contracts[k] = true; }
    serialized[k] = {
      contract,
      combined: combined.toString(10),
      dgd: dgds.dividedBy(1e9).toString(10),
      dgdWei: dgds.toString(10),
      unclaimedDgdWei: unclaimed && unclaimed.toString(10),
    };
    return null;
  });

  const total = (totalDgds && totalDgds.add(totalUnclaimed || 0)) || totalUnclaimed;
  const contractCount = Object.keys(contracts).length;
  const fileName = `${scriptsDir}/balances-${toBlock}-${created}.json`;
  process.stdout.write(`\n\nWriting: ${fileName}`);
  // write the fle
  fs.writeFileSync(fileName, JSON.stringify({
    toBlock,
    contractCount,
    totalDgdWei: totalDgds.toString(10),
    grandTotalWei: total.toString(10),
    unclaimedDgdWei: totalUnclaimed.toString(10),
    balances: serialized,
    // contracts,
  }));
  // next step, do the things...
  process.stdout.write(`\n\n✅  Done! total: ${total / 1e9} target: ${totalDgdWei / 1e9} diff: ${(totalDgdWei - total) / 1e9} contracts: ${contractCount}\n`);
}());
