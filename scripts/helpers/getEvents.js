const eachLimit = require('async/eachLimit');

const maxBatch = 10000;
const conenctons = 16;

module.exports = function (method, name, args, cb) {
  console.log('here we go');
  // TODO split based on toBlock, aim for a batch of 20 requests?
  function get(callback) {
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
    eachLimit(batches, conenctons, (args2, eachCallback) => {
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
      callback(null, combined);
    });
  }
  return cb ? get(cb) : new Promise(resolve => get((e, r) => resolve(r)));
};
