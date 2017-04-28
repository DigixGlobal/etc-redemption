# [Draft] Digix ETC Redemption Process

This repository contains contracts and scripts for the deployment and execution of Digix's proposed ETC withdraw mechanism.

## Overview

[Digix recently outlined](https://medium.com/@Digix/digixdao-etc-withdrawal-proposal-v1-0-mar-22-2017-578fe1575a40) a proposal to allow DGD holders to withdraw ETC. Since this proposal, with feedback from the DGD holder community, it has evolved into a less complex withdrawal process (by removing the voting step). This repository has been produced to describe and provide all the tools needed perform this updated withdrawal process.

The proposed contracts and process details are presented to the community for discussion, criticisms and code review.

## Terminology

* **Testnet** Kovan Testnet
* **ETH Chain** Ethereum Mainnet
* **ETC Chain** Ethereum Classic Mainnet
* **RTC** Redemption Token Contract
* **DGD-ETCR** DigixDAO Ethereum Classic Redemption Tokens
* **Snapshot Block** Block on ETH chain where data is collected determine DGD balances and thus redemption token ledger
* **Activation Block** The block on ETC chain where the redemption token is activated (after this block, transfers and redemptions are allowed)
* **MultiSig** Contracts for holding funds and executing methods on both ETH and ETC chains

## Changes to Proposal v1

This updated includes some changes to the [previously announced proposal](https://medium.com/@Digix/digixdao-etc-withdrawal-proposal-v1-0-mar-22-2017-578fe1575a40) - please view the previous version for additional context.

### No More Voting

The main change is that we've decided to skip the carbonvote step. After gauging sentiment from DGD holders (including 'whales' and the general DGD community), there was no resistance to the principal of returning ETC to DGD holders. Therefore we have determined it would be better to forego the voting process as it would yield additional development time and reach a non-controversial already-known outcome (the motion to refund ETC to DGD holders).

### Redemption Token Contract (RTC)

In the previous proposal, the RTC was somewhat sidelined as the voting system would be the primary refund mechanism. Without voting, the RTC becomes the primary (only) mechanism, so additional time has been spend designing and developing it accordingly. See [The Contract](#The Contracts) section for more details.

When minting token balances held by the, minted balances represents 1:1 with snapshot DGD balances. These redemption tokens are known as 'DGD-ETCR'. To claim ETC, holders of DGD-ETCR simple call a method on the DGD-ETCR contract to burn their holdings in return of an ETC value. At the point of burning, the balance of DGD-ETCR (their DGD balance) burn to 0, and a fixed rate will be used to convert this balance into ETC. (1000000 DGD -> 1000000 DGD-ETCR -> ~223000 ETC)

The 'rate' used will be close to 100% of the original ETC pool, but with an additional fee deduced from the pool based on the gas used for deployment and minting.

### MultiSig & Top-up System

* Two MultiSig contracts
  * ETH Chain (to hold ETH from the Digix crowdsale until governance contracts live)
  * ETC Chain (to hold refunded ETC and top up to the RTC, and execute RTC methods)
* 4 anonymous trusted parties will be in control of this contract
* 3/4 of the parties to approve any transaction made from it

A 'top-up' system will be used when passing funds to the RTC to reduce the effects of any unforeseen exploits. Batches of 100,000 ETC (?) will be added to the RTC as required (and topped up as the remaining balance reaches 10,000).

### Additional End User Resources

As development focus shifted from the carbonvote, process to the RTC, some additional end-user requirements were identified to enable DGD holders to perform the redemption on the ETC chain with ease.

* Instructions for MEW / CLI / Mist
* Public ETC RPC Node (compatible with MEW / Spectrum / web3-console)
* Instructions for installing local ETC Node (as fallback for public node)
* Spectrum UI for redemption process (on ETC chain)
* Best practices for hardware / offline signing

## Redemption Process

The new process is split roughly into the following steps:

### Set Up

This stage is managed by DigixGlobal and will not require interaction from DGD holders

1. Public announcement of *snapshot* and *activation* block made
1. After the snapshot block, contract is deployed to ETC and balances are minted
1. Balances are confirmed, RTC is funded by Multisig (using top-up)

### Redemption

After the activation block is reached, users with an DGD-ETCR balance will be able to proceed with redemptions; (optionally trading and then) burning their DGD-ETCR tokens in return for ETC using one of the following ways:

* Use a local ETC Node
* Use MEW + RPC Node
* Depositing to an exchange during the snapshot block
* Use Spectrum Alpha + RPC Node

#### Note to contract holders

For those who hold their DGD balances in a contract address that may does not exist on ETC chain, two options are provided:

* Ensure the contract can execute other contracts (to call the redeem method)
* Move the DGDs into a regular address before the Snapshot Block
* Move the DGDs into an Exchange before the Snapshot Block
* Contact Digix to manually process redemption

#### Note to Exchanges

After discussing how exchanges can optimally engage with the withdrawal process, we identified the following general pattern that should be adopted by exchanges to ensure an easy:

1. Before the snapshot block, disable deposits, withdrawals and trading of DGD
1. On the snapshot block, move DGD into a single account / multisig
1. After the activation block, call the redeem method on the token
1. Credit DGD holders with their proportion of the redeemed ETC
1. Re-open trading, deposits and withdrawals

### After 1 Year

DGD holders perform a vote to determine action on unclaimed ETC

* Extend the balance 1 year
* Extend the withdrawal indefinitely (switch owner to `0x0` address)
* Other options to be determined by DGD holders

## Redemption Token Contract

For full documentation on the methods please see the contract docs. The RTC is an extended EIP20 tradable token with the additional features:

* Permissioned
  * Owned by one admin
  * Admin can transfer ownership
  * Admin can control the activation block / mint tokens / drain contract
* Time-Lockable
  * Disables transfers / redemptions until a specific (activation) block is reached
* Redeemable
  * Admins can fund (ETC) value to the contract
  * Admins can set the rate of ETC redeemed for each token
  * Users with a balance can call 'redeem' (or proxy via default function) burn balance in return for ETC

A test suite with 100% method coverage has been added to this repository under `./test`, they can be run with `truffle test`.

### Multisig Wallet

A Multisig contract for holding both ETH and ETC after the activation block will be: https://github.com/ConsenSys/MultiSigWallet. Basic integration tests has been written in this project, with unit tests available in the ConsenSys repository.

## Scripts

Optional `npm run estimate-gas` to estimate ETC gas requirements.

1. `npm run step-1 <snapshot_block>` Get the Snapshot (run this with multiple clients & Etherscan)
1. `npm run step-2 <snapshot_block>` Confirm the Balance Reports are the same
1. `npm run step-3 <snapshot_block>` Publish report to IPFS
1. `npm run step-4 <snapshot_block>` Migrate Contracts to Kovan (for testing)
1. `npm run step-5 <tx> <snapshot_block>` Mint the Tokens on Kovan (optional resume from tx#)
1. `npm run step-6 <snapshot_block>` Confirm balances on Kovan
1. `npm run step-7 <snapshot_block>` Configure contract for live mode on Kovan (activationBlock, transfer to Multisig)
1. `npm run step-8 <snapshot_block>` Migrate the Contracts to ETC Chain
1. `npm run step-9 <tx> <snapshot_block>` Mint the Tokens on ETC Chain (optional resume from tx#)
1. `npm run step-10 <snapshot_block>` Confirm the balances on ETC Chain
1. `npm run step-11 <snapshot_block>` Configure contract for live mode on ETC Chain (activationBlock, transfer to Multisig)
1. `npm run step-10 <snapshot_block>` Confirm the balances once again before sending value


## *Estimated* Timelines

|Estimated Date|Event|
|---|---|
|Apr 28th|1 week of public review of this updated proposal, contract and scripts|
|May 5th|Around 1 week to make any update or bugfixes to this proposal|
|May 12th|1 week to announce the snapshot block|
|May 19th|Snapshot block occurs, RTC deployed|
|May 20th|Activation block reached, redemption allowed|
