import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
import path from "path";
import { getAddressSaver, verify } from "./utils/helpers";
const { ethers, network } = hre;

const CONTRACT_NAME = "Router";
const FILE_NAME = "deployment-balancer-contract-addrs-test";
const PATH_TO_FILE = path.join(__dirname, `./${FILE_NAME}.json`);

async function deploy() {
    const [deployer] = await ethers.getSigners();

    const args = {
        vault: "0xd48F8CF9198a969e6b730525862C2F2B0d8aD27B",
        weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
        // permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
        routerVersion:
            '{"name":"Router""version":2"deployment":"20250715-v3-router-v2"}'
    };

    console.log("\n --- Deployed data --- \n");
    console.log("* ", deployer.address, "- Deployer address");
    console.log("* ", hre.network.name, "- Network name");
    console.log("* ", CONTRACT_NAME, "- Contract name");
    console.log("* Arguments: ", args);
    console.log("\n --- ------- ---- --- ");

    const Contract = await ethers.getContractFactory(CONTRACT_NAME);
    // const contract = await Contract.connect(deployer).deploy(args.vault, args.weth, args.permit2, args.routerVersion);
    const contract = await Contract.connect(deployer).deploy(args.vault, args.weth, args.routerVersion);
    const deployTransaction = (await contract.deployed()).deployTransaction.wait();

    console.log(`Contract: \`${CONTRACT_NAME}\` is deployed to \`${contract.address}\`|\`${hre.network.name}\`.`);

    const saveAddress = getAddressSaver(PATH_TO_FILE, network.name, true);
    saveAddress(
        CONTRACT_NAME,
        {
            address: contract.address,
            deployedBlock: (await deployTransaction).blockNumber,
            chainId: ethers.provider.network.chainId
        },
        false
    );

    console.log("\nDeployment is completed.");
    // await verify(contract.address, [args.vault, args.weth, args.permit2, args.routerVersion]);
    await verify(contract.address, [args.vault, args.weth, args.routerVersion]);
    console.log("\nDone.");
}

deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
