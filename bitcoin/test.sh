set -e

EXTERNAL_WALLET_DESCRIPTOR=$(node ./print_wallet_descriptor.js 0);
INTERNAL_WALLET_DESCRIPTOR=$(node ./print_wallet_descriptor.js 1);

echo "External wallet descriptor: $EXTERNAL_WALLET_DESCRIPTOR"
echo "Internal wallet descriptor: $INTERNAL_WALLET_DESCRIPTOR"

WALLET_NAME="nano-ledger-s"

echo "Importing into wallet $WALLET_NAME"

# TODO don't fail if wallet already exists
docker exec bitcoin bitcoin-cli -regtest createwallet $WALLET_NAME true true > /dev/null
EXTERNAL_WALLET_DESCRIPTOR=$(docker exec bitcoin bitcoin-cli -regtest getdescriptorinfo "$EXTERNAL_WALLET_DESCRIPTOR" | jq -r '.descriptor')
IMPORT_REQUEST_EXTERNAL=$(jq --arg DESC $EXTERNAL_WALLET_DESCRIPTOR '. + {desc: $DESC, internal: false}' import_multi_request.json)

INTERNAL_WALLET_DESCRIPTOR=$(docker exec bitcoin bitcoin-cli -regtest getdescriptorinfo "$INTERNAL_WALLET_DESCRIPTOR" | jq -r '.descriptor')
IMPORT_REQUEST_INTERNAL=$(jq --arg DESC $INTERNAL_WALLET_DESCRIPTOR '. + {desc: $DESC, internal: true}' import_multi_request.json)

docker exec bitcoin bitcoin-cli -regtest -rpcwallet=$WALLET_NAME importmulti "[$IMPORT_REQUEST_EXTERNAL, $IMPORT_REQUEST_INTERNAL]" "{\"rescan\": true}" > /dev/null

RAW_TX=$(node ./create_spending_tx.js $WALLET_NAME)

echo "Raw spending tx: $RAW_TX"

docker exec bitcoin bitcoin-cli -regtest sendrawtransaction "$RAW_TX"
