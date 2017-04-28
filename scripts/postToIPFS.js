const fs = require('fs');
const ipfsAPI = require('ipfs-api');
const { scriptsDir, toBlock } = require('./helpers/config');

const ipfs = ipfsAPI({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' });


((async function () {
  const filename = fs.readdirSync(scriptsDir).filter(a => a.indexOf(`balances-${toBlock}-`) === 0)[0];
  const path = `${scriptsDir}/${filename}`;
  if (!filename) { throw new Error('report doesnt exist'); }
  process.stdout.write(`Uploading ${path} ...\n`);
  const uploads = await ipfs.files.add([{ path: filename, content: fs.createReadStream(path) }]);
  process.stdout.write(`✅  Uploaded to: https://ipfs.infura.io/ipfs/${uploads[0].hash}\n`);
})());
