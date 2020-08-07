const axios = require("axios");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

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
    const externalDesc = args[1];
    const internalDesc = args[2];

    await client.post("/", {
        method: "createwallet",
        params: [
            walletName,
            true,
            true
        ]
    });

    // add checksums to descriptor
    let externalAddressesDesc = await client.post("/", {
        method: "getdescriptorinfo",
        params: [
            externalDesc,
        ]
    }).then(response => response.data.result.descriptor);
    let changeAddressesDesc = await client.post("/", {
        method: "getdescriptorinfo",
        params: [
            internalDesc,
        ]
    }).then(response => response.data.result.descriptor);

    let response = await client.post(`/wallet/${walletName}`, {
        method: "importmulti",
        params: [
            [
                {
                    desc: externalAddressesDesc,
                    timestamp: 0,
                    range: 0,
                    internal: true,
                    watchonly: true,
                    keypool: true
                },

                {
                    desc: changeAddressesDesc,
                    timestamp: 0,
                    range: 0,
                    internal: true,
                    watchonly: true,
                    keypool: true
                }
            ],
            {
                rescan: true
            }
        ]
    });

    if (!response.data.result[0].success) {
        throw new Error("Unable to import first key")
    }
    if (!response.data.result[1].success) {
        throw new Error("Unable to import second key")
    }
}

main().catch(error => {
    if (error.response) {
        console.error(error.response)
    } else {
        console.error(error)
    }
    process.exit(1);
})