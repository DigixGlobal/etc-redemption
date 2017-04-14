const Web3 = require('web3');
// const LightWalletProvider = require('@digix/truffle-lightwallet-provider');
const redemptionToken = require('../build/contracts/EtcRedemptionToken.json');

const { KEYSTORE, PASSWORD } = process.env;
if (!KEYSTORE || !PASSWORD) { throw new Error('You must export KEYSTORE and PASSWORD (see truffle.js)'); }

// const web3 = new Web3(new LightWalletProvider({
//   keystore: KEYSTORE,
//   password: PASSWORD,
//   rpcUrl: 'https://ethereum03.digixdev.com/',
//   pollingInterval: 4000,
// }));

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:6545'));
const rToken = web3.eth.contract(redemptionToken.abi).at('0xffeb0c939f34a1eb96b679575b543b8c51dddb22');

module.exports = function ({ balances }) {
  const from = web3.eth.accounts[0];
  // console.log(rToken.mint('0x19f24d09dbf99ccb430a04bec86824707da9a974', 1, { from }));
  // Object.keys(balances).forEach((address) => {
  //   console.log('minting', address, balances[address]);
  //   rToken.mint(address, balances[address], { from });
  // });
  // TODO confirm all balances using `mint` event
};
