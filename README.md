# Ledger Nano S PoC

## Bitcoin

This PoC uses a bitcoind watch-only wallet to track the account of a Ledger Nano S.

This allows us to sign and send transactions from the Ledger Nano S without the Ledger Live servers.

To run it, you will need:

- yarn
- comit-scripts (cargo install comit-scripts --git https://github.com/comit-network/create-comit-app)

To run it, do:

1. `cd bitcoin`
2. `yarn`
3. Plug your ledger, unlock it and open the Bitcoin app
4. `node get_new_address.js`
5. Copy the address into `addresses_to_fund` within `../ComitScripts.toml`
6. `comit-scripts start-env` in the repository root
7. Run `test.sh` within the `bitcoin` directory

## Ethereum

