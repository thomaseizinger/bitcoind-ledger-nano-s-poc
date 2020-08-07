const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid");
const AppBtc = require("@ledgerhq/hw-app-btc");
const logs = require("@ledgerhq/logs");
const axios = require("axios");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const bitcoin = require("bitcoinjs-lib");
const serializer = require('@ledgerhq/hw-app-btc/lib/serializeTransaction');

// logs.listen(log => console.log("NANO-LEDGER-S:", log))

async function main() {
    const {stdout} = await exec('docker exec bitcoind-regtest cat /root/.bitcoin/regtest/.cookie');
    let [username, password] = stdout.split(":");

    let client = axios.create({
        baseURL: "http://localhost:18443",
        auth: {
            username,
            password
        }
    });

    const args = process.argv.slice(2);
    const walletName = args[0];

    let createPsbtResponse = await client.post(`/wallet/${walletName}`, {
        method: "walletcreatefundedpsbt",
        params: [
            [],
            [
                {
                    "bcrt1q3vpmd8rpgr3duys6fv30lgyau3n6lh07qns2ck": 1
                }
            ],
            null,
            {
                feeRate: 0
            }
        ]
    });

    let psbt = createPsbtResponse.data.result.psbt;

    let decodeResponse = await client.post(`/wallet/${walletName}`, {
        method: "decodepsbt",
        params: [psbt]
    });

    psbt = bitcoin.Psbt.fromBase64(psbt);

    let transport = await TransportNodeHid.default.open();
    const btc = new AppBtc.default(transport)

    const outputScriptHex = await serializer.serializeTransactionOutputs({
        outputs: psbt.txOutputs.map(output => {
            let amount = Buffer.alloc(8);
            amount.writeBigUInt64LE(BigInt(output.value), 0);

            return {
                amount: amount,
                script: output.script
            }
        })
    }).toString('hex');

    let decodedPsbt = decodeResponse.data.result;
    let utxo = decodedPsbt.tx.vin[0];

    let prevTx = await client.post(`/wallet/${walletName}`, {
        method: "getrawtransaction",
        params: [utxo.txid, false]
    }).then(response => response.data.result);

    let ledgerPrevTx = btc.splitTransaction(prevTx, true);

    let inputIndex = 0;
    let signedTx = await btc.createPaymentTransactionNew({
        inputs: [
            [ledgerPrevTx, utxo.vout]
        ],
        associatedKeysets: [ decodedPsbt.inputs[inputIndex].bip32_derivs[0].path ],
        outputScriptHex,
        segwit: true,
        additionals: ["bech32"]
    });

    console.log(signedTx)
}

main().catch(error => {
    if (error.response) {
        console.error(error.response.data)
    } else {
        console.log(error);
    }
    process.exit(1);
})