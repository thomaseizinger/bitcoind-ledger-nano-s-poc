const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid");
const AppEth = require("@ledgerhq/hw-app-eth");
const ethers = require("ethers")

const getFirstAddress = async () => {
    let transport = await TransportNodeHid.default.open();
    const eth = new AppEth.default(transport)
    const result = await eth.getAddress("m/44'/60'/0'/0")

    return result.address;
}

async function main() {
    let address = await getFirstAddress();

    console.log(address);

}

main()
