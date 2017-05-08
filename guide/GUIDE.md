# Digix ETC Redemption User Guide

## Overview

This document is a guide for DGD holders outlining the required steps for redeeming ETC. For background, please review previous announcements and documentation on the ETC redemption contract.

DGD holders are credited with DGDR tokens on the ETC chain, which can be used to call the `redeem(_to)` method on the DGDR contract and exchange them for an equivalent ETC balance. This requires executing a transaction on the ETC chain using the same keystore that holds DGD on the main chain. There are several methods available, which one used depends on the DGDR holder's keystore type and security/convenience preferences.

The sender of the redemption transaction (DGDR holder) will need a small amount of ETC to preform the transaction.

## Replay Attack Concerns

ETC and ETH addresses are compatible with each other, so you can generate wallets in an ETH client and use it on the ETC chain. There is however the possibility of transactions being replayed from one chain to the other when using older clients or firmware. There is also the possibility of old transactions being replayed if a previously unfunded account becomes funded.

For this reason, when using ETC, try to keep it separate from accounts that have ever used or received ETH.

The `redeem` method on the Redemption Contract needs to be passed an address; `_to` should be set to:

* A *different* (preferably new) ETC address that you control, to prevent potential replay attacks
* A standard address that you can access the keystore of; **NOT an exchange or contract address!**

Additionally, DGDR uses Ethereum's token 'standard' and it can be used on many ERC20-compatible applications. DGDR balances are burned entirely (to 0) on redemption to prevent double spends.

## Redemption Contract Address

Current ETC *dry-run* test address: 0x2ea9a44fb6bf22f09263eb59807aa5bc7f6dc9e2

The real (not dry-run) deployment address will be announced at a future date and can be seen in the [Spectrum UI](https://spectrum-alpha.digixdev.com).

![Contract address](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/C9A18098-521B-485D-8155-143786AC733E.png)

## ABI (just the `redeem` method)

```json
[{ "constant": false, "inputs": [{ "name": "_to", "type": "address" }], "name": "redeem", "outputs": [], "payable": false, "type": "function" }]
```

## Recommended Methods for sending `redeem` transaction

- [Spectrum (bespoke UI)](#spectrum)
- [MyEtherWallet](#myetherwallet)
- [Parity](#parity)
- [Geth](#geth)

At present the most battle-tested client is MEW. You can also use the newer (but less tested) Spectrum (by Digix), which has a UI built specifically for the ETC Redemption Contract. These web clients support a range of different features:

- Keystore File (UTC / JSON)
- Ledger Nano S 1.2+ *
- Offline Signing
- TREZOR (MEW only)
- Mnemonic Phrase (MEW Only)
- Parity Phrase (MEW Only)

\* IF using the Ledger Nano S, you need at least firmware version 1.2, but it appears that v 1.2 does not support eip-155 replay protection. This is not an issue if you are only using it to sign the `redeem` method (as this cannot be replayed), but if you are doing any other transactions, it's advised to upgrade to at least v1.3 firmware, which prevents replays in Spectrum and MyEtherWallet.

### Fallback Options

Should all of the public RPC nodes become unavailable for some reason such as a Denial of Service attack, or you just prefer to be decentralized, you can still publish the redemption transaction by running a local ETC node. We would recommend using either Parity, or for hardware wallets, the [local dist version of MEW](https://github.com/kvhnuke/etherwallet#users-non-developers) and either Parity of Geth (ETC Fork).

You can also visit the latest version online via infura's IPFS gateway:

`<latest_ipfs_hash> = QmV6fagfrX8eZmtJnQnrHCKUAqbWquzM8iiMhZty3LMqwL` (updated 8/5)

https://ipfs.infura.io/ipfs/<latest_ipfs_hash>

### Running Locally

Running over HTTP allows you to connect to a local RPC instance running on http:// (such as parity or geth)

You create a folder that is small and portable and can be easily hosted or copied and used from a USB drive

The recommended method is to install [IPFS](https://github.com/ipfs/go-ipfs) locally, and start it using `ipfs daemon`:

You can then navigate to a local gateway:

http://localhost:8090/ipfs/<latest_ipfs_hash>

Or you can copy Spectrum and run locally

```bash
$ ipfs get <latest_ipfs_hash> -o spectrum
Saving file(s) to spectrum
4.54 MB / 4.54 MB [================================================] 100.00% 0s
$ cd spectrum
$ open index.html # opens in browser, or start static server instead
```

You could even copy this folder to an SD card and run it on a mobile phone by navigating to `file:///sdcard<path_on_device>/index.html`

In modern versions of chrome, you can simple save `cmd & s` and select `Web Page, Complete` to save a working offline version of Spectrum (although right now the icons don't work - fix incoming).

## Ways of transacting with the `redeem` method

### Spectrum

https://www.youtube.com/watch?v=4I61a45Q_t4

### MyEtherWallet

https://myetherwallet.com/#contracts

Select ETC (top right)

![Select ETC (top right)](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/451060D0-F428-4609-9A8F-A55B86C6A92D.png)

Open the "contracts" tab

![Open the "contracts" tab](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/8427C247-F003-4D11-81CC-8C31CB962C1C.png)

Enter the Contract Address

Paste in the ABI from above

Click "access"

![Click "access"](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/3D37C4A4-5252-44C6-9E65-B199AAE6E4D8.png)

In the 'to' field, enter the address you wish to be sent the redeemed ETC

Select the type of wallet to use for calling the method, and unlock it.

Click "write" to publish the redemption transaction.

Transaction Popup Appears

![Transaction Popup Appears](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/50FBC128-993C-40B4-BC53-DF0574CBBEB6.png)

Amount to send: 0
Gas Limit: Should be automatically set to around at least ~75k, or manually 80k+  

Click Generate Transaction

Click "Yes, I am sure"

You should then see a transaction confirmation, click 'View your transaction' and record the TxID

You should now have the ETC redeemed

### Parity

Start Parity with `parity --chain classic`

Navigate to URL http://127.0.0.1:8180/

Contracts -> Watch

![Contracts -> Watch](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/22976D61-5785-4C3B-B679-E69C4D651EAD.png)

Select 'Custom Contract'

Click 'Next'

Enter Contract Details

![Enter Contract Details](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/4C6932C7-03A6-4AD4-924A-05353289A4BC.png)

Click "Add Contract"

Select the New Contract

![Select the New Contract](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/7107AFB3-5428-4C66-A0F1-0757C58D45C3.png)

Click "Execute"

![Click "Execute"](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/AACE0F5C-5B73-4689-8E84-FF0F81285755.png)

Enter a recipient address in the `_to` field

Check "Advanced Sending options"

![Check "Advanced Sending options"](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/F2958351-C163-4BE7-A9C0-7443E59B437F.png)

Click Next

Set Gas to 10000

![Set Gas to 10000](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/2994AAEE-6494-4D7E-9E90-38E212759F31.png)

Click Post Transaction

![Click Post Transaction](https://raw.githubusercontent.com/DigixGlobal/etc-redemption/master/guide/768E0CD8-BF4A-4CAA-9D8D-A0A4F62CE9AB.png)

Enter your Password in parity signer and confirm the request

You should now have a transaction ID, please record it

### Geth (Ethereum Classic)

Download the [Ethereum Classic Geth Client](https://github.com/ethereumproject/go-ethereum) and use the CLI or [truffle](http://truffleframework.com/) :)
