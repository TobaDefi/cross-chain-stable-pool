import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
import path from "path";
import { getAddressSaver, verify } from "./utils/helpers";
const { ethers, network } = hre;
const { AddressZero } = ethers.constants;

const CONTRACT_NAME = "Router";
const FILE_NAME = "deployment-balancer-contract-addrs-test";
const PATH_TO_FILE = path.join(__dirname, `./${FILE_NAME}.json`);

const VAULT_TEST_ADDRESS = "0xE0De5067454B2ce20cd74605C9D85b77bcE05DeD"; // BASE SEPOLIA

async function deploy() {
    const [deployer] = await ethers.getSigners();

    const args = {
        vault: VAULT_TEST_ADDRESS,
        weth: AddressZero,
        routerVersion: '{"name":"Router""version":2"deployment":"20250723-v3-router-v2"}'
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
    await verify(contract.address, [args.vault, args.weth, args.routerVersion]);
    console.log("\nDone.");
}

deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
