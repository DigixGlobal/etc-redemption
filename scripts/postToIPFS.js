const fs = require('fs');
const ipfsAPI = require('ipfs-api');

const ipfs = ipfsAPI({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' });

const scriptsDir = './scripts/data';
const toBlock = parseInt(process.argv[process.argv.length - 1], 10);
if (!toBlock) { throw new Error('Must pass a block number'); }

((async function () {
  const filename = fs.readdirSync(scriptsDir).filter(a => a.indexOf(`balances-${toBlock}-`) === 0)[0];
  const path = `${scriptsDir}/${filename}`;
  if (!filename) { throw new Error('report doesnt exist'); }
  process.stdout.write(`Uploading ${path} ...\n`);
  const uploads = await ipfs.files.add([{ path: filename, content: fs.createReadStream(path) }]);
  process.stdout.write(`✅  Uploaded to: https://ipfs.infura.io/ipfs/${uploads[0].hash}\n`);
})());
