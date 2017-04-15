Currently configured with `withdrawNet: kovan`

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

1. Set the contract withdrawal rate `npm run set-rate <rate>` (1 Token = `<rate>` ETC)
1. Set the activation block `npm run set-activation <activation_block>`

...Then just send the entire ETC balance over to the contract and wait for the activation block!

# TODO

* Better permissions system (how can we reduce the damage of lost key)
