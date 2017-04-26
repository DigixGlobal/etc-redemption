const toBlock = parseInt(process.argv[process.argv.length - 1], 10);
if (!toBlock) { throw new Error('Must pass a block number'); }

module.exports = function (artifacts) {
  return new Promise((resolve) => {
    console.log('getting etcredt');
    artifacts.require('EtcRedemptionToken').deployed().then((token) => {
      resolve({ token, toBlock });
    });
  });
};
