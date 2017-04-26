# Test

Run `truffle test`

# Steps

Optional `npm run estimate-gas` to estimate ETC requirements

1. `npm run step-1 <block>` Get the Balances (with multiple clients + Etherscan)
1. `npm run step-2 <block>` Confirm the Balance Reports
1. `npm run step-3 <block>` Publish to IPFS
1. `npm run step-4 <block>` Migrate Contracts to Kovan
1. `npm run step-5 <block>` Mint the Tokens on Kovan
1. `npm run step-6 <block>` Confirm Balances on Kovan
1. `npm run step-7 <block>` Configure contract for live mode on Kovan (activationBlock, transfer to Multisig)
1. `npm run step-8 <block>` Migrate the Contracts to Mainnet
1. `npm run step-9 <block>` Mint the Tokens on Mainnet
1. `npm run step-10 <block>` Confirm the Balance on Mainnet
1. `npm run step-11 <block>` Configure contract for live mode on Mainnet (activationBlock, transfer to Multisig)
