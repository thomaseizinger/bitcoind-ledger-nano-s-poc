const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid");
const AppEth = require("@ledgerhq/hw-app-eth");
const ethers = require("ethers")
const logs = require("@ledgerhq/logs");

// logs.listen(log => console.log("NANO-LEDGER-S:", log))

async function main() {
    const path = "m/44'/60'/0'/0";

    const transport = await TransportNodeHid.default.open();
    const eth = new AppEth.default(transport)
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

    const address = await eth.getAddress(path).then(r => r.address);

    const tx = {
        nonce: await provider.getTransactionCount(address),
        data: '0x61018c61000f60003961018c6000f3361561007957602036141561004f57602060006000376020602160206000600060026048f17f2e78258b65c071fa514fda0b6bb1ce007fe96571d47e60414f53f150f36de11260215114166100ae575b7f696e76616c69645365637265740000000000000000000000000000000000000060005260206000fd5b42635f2367fd106100f1577f746f6f4561726c7900000000000000000000000000000000000000000000000060005260206000fd5b7f72656465656d656400000000000000000000000000000000000000000000000060206000a173e48a1a7d28113399e11bdfd8017d1f440a3dc904602052610134565b7f726566756e64656400000000000000000000000000000000000000000000000060006000a17312075b9a25a8d893de935f7271cd0dda4097c4f3602052610134565b63a9059cbb6000527f0000000000000000000000000000000000000000000000007ce66c50e2840000604052602060606044601c600073320026b4541b5fd2145e34b638fe543d6b0acbab620186a05a03f150602051ff',
        value: '0x0',
        gasLimit: '0x100000',
        gasPrice: '0x10',
        chainId: await provider.getNetwork().then(network => network.chainId)
    };
    const serialized = ethers.utils.serializeTransaction(tx);

    let {v, r, s} = await eth.signTransaction(path, serialized.substr(2));

    let signedTx = ethers.utils.serializeTransaction(tx, v + r + s);

    let transactionResponse = await provider.sendTransaction(signedTx);

    let transactionReceipt = await transactionResponse.wait(1);

    if (transactionReceipt.status === 0) {
        throw new Error("TX failed")
    }

    console.log("Deployed contract at {}", transactionReceipt.contractAddress);
}

main()

