const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid");
const AppBtc = require("@ledgerhq/hw-app-btc");
const bitcoin = require("bitcoinjs-lib");

const getFirstAddress = async () => {
    let transport = await TransportNodeHid.default.open();
    const btc = new AppBtc.default(transport)
    const result = await btc.getWalletPublicKey("m/44h/1h/0h/0/0", { format: "bech32" })

    return bitcoin.payments.p2wpkh({ pubkey: bitcoin.ECPair.fromPublicKey(Buffer.from(result.publicKey, 'hex')).publicKey, network: bitcoin.networks.regtest }).address
}

async function main() {
    let address = await getFirstAddress();

    console.log(address);

}

main()