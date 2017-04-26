/* eslint-disable no-console */
const ProviderEngine = require('web3-provider-engine');
// const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');

const engine = new ProviderEngine();
// cache layer
// engine.addProvider(new CacheSubprovider());
// filters
engine.addProvider(new FilterSubprovider());
// data source
engine.addProvider(new RpcSubprovider({ rpcUrl: 'https://mainnet.infura.io' }));
// network connectivity error
engine.on('error', (err) => { console.log(err.stack); });
// start polling for blocks
engine.start();

module.exports = engine;
