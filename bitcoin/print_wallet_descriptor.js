const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid");
const AppBtc = require("@ledgerhq/hw-app-btc");
const createXpub = require('create-xpub');
const bitcoinjs = require('bitcoinjs-lib');
const logs = require("@ledgerhq/logs");

// logs.listen(log => console.log("NANO-LEDGER-S:", log))

function makeFingerPrint(publicKey) {
    return bitcoinjs.crypto.hash160(Buffer.from(compressPublicKey(publicKey), 'hex')).toString('hex').substr(0, 8);
}

const compressPublicKey = publicKey => {
    if (publicKey.startsWith('02') || publicKey.startsWith('03')) {
        return publicKey;
    }

    const yIsEven = (parseInt(publicKey.slice(-2), 16) % 2 === 0);

    return (yIsEven ? '02' : '03') + publicKey.slice(2, 66);
};

const getWalletDescriptors = async (chain) => {
    let transport = await TransportNodeHid.default.open();
    const btc = new AppBtc.default(transport)

    const master = await btc.getWalletPublicKey("", { format: "bech32" })
    let fingerprint = makeFingerPrint(master.publicKey);

    let path = "/84'/1'/0'";
    const result = await btc.getWalletPublicKey(`m${path}`, { format: "bech32" })
    let xpub = createXpub({
        networkVersion: createXpub.testnet,
        depth: 3,
        childNumber: 0, // TODO: is 0 correct here?
        ...result
    });

    return `wpkh([${fingerprint}${path}]${xpub}/${chain}/*)`
}

async function main() {
    const args = process.argv.slice(2);

    let chain = parseInt(args[0], 10);

    console.log(await getWalletDescriptors(chain))
}

main()
