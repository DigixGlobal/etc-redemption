Currently configured with `withdrawNet: kovan`

## Steps

Optional `npm run estimate-gas` to estimate ETC requirements.

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

#### 1. Deploy the contract

* Migrate contract to `withdrawNet` with truffle `truffle migrate --reset --network <withdrawNet>`

#### 2. Get the Balances

* Start and sync a full node with `parity --pruning=archive`
* Get the balances `npm run get-balances <block_number>`
* Review JSON file `balances-<block_number>.json`

#### 3. Mint the tokens

1. Mint the tokens `npm run mint-tokens <block_number>`
1. Check the balances `npm run confirm-balances <block_number>`

#### 4. Configure contract

1. Set the activation block `npm run set-activation <activation_block>`

...Then just send the entire ETC balance over to the contract and wait for the activation block!

# TODO

* Better permissions system (how can we reduce the damage of lost key)
* Option to configure the rate after it's been published (use dgdWei and had-code the rate)?
