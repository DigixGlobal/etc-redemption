const LightWalletProvider = require('@digix/truffle-lightwallet-provider');

const { KEYSTORE, PASSWORD } = process.env;

if (!KEYSTORE || !PASSWORD) { throw new Error('You must export KEYSTORE and PASSWORD (see truffle.js)'); }

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 6545,
      network_id: '*',
    },
    kovan: {
      network_id: '42',
      provider: new LightWalletProvider({
        keystore: KEYSTORE,
        password: PASSWORD,
        rpcUrl: 'http://localhost:8545/',
        // rpcUrl: 'https://kovan.infura.io/',
        // debug: true,
        pollingInterval: 2000,
      }),
    },
    classic: {
      network_id: '1',
      gas: 4500000,
      gasPrice: 21100000000,
      provider: new LightWalletProvider({
        keystore: KEYSTORE,
        password: PASSWORD,
        // debug: true,
        rpcUrl: 'https://digixparity04.digix.io/',
      }),
    },
    mainnet: {
      network_id: '1',
      provider: new LightWalletProvider({
        keystore: KEYSTORE,
        password: PASSWORD,
        rpcUrl: 'https://mainnet.infura.io/',
      }),
    },
  },
};
