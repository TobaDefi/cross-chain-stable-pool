import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
import path from "path";
import { getAddressSaver, verify } from "./utils/helpers";
const { ethers, network } = hre;

const CONTRACT_NAME = "TestToken";
const FILE_NAME = "deployment-contract-addrs";
const PATH_TO_FILE = path.join(__dirname, `./${FILE_NAME}.json`);

const TOKEN_NUMBER = 4; // Number of tokens to deploy

async function deploy() {
    const [deployer] = await ethers.getSigners();

    console.log("\n --- Deployed data --- \n");
    console.log("* ", deployer.address, "- Deployer address");
    console.log("* ", hre.network.name, "- Network name");
    console.log("* ", CONTRACT_NAME, "- Contract name");
    console.log("\n --- ------- ---- --- ");

    const Contract = await ethers.getContractFactory(CONTRACT_NAME);



        const tokenName = `Test Token ${TOKEN_NUMBER}`;
        const tokenSymbol = `TT${TOKEN_NUMBER}`;
        const contract = await Contract.connect(deployer).deploy(tokenName, tokenSymbol);
        const deployTransaction = (await contract.deployed()).deployTransaction.wait();

        console.log(`Contract: \`${CONTRACT_NAME}\` is deployed to \`${contract.address}\`|\`${hre.network.name}\`.`);
        const saveAddress = getAddressSaver(PATH_TO_FILE, network.name, true);
        saveAddress(
            `${CONTRACT_NAME}_${TOKEN_NUMBER}`,
            {
                address: contract.address,
                deployedBlock: (await deployTransaction).blockNumber,
                chainId: ethers.provider.network.chainId
            },
            false
        );

        console.log(`\nDeployment the ${tokenName} is completed.`);
        await verify(contract.address, [tokenName, tokenSymbol]);

    console.log("\nDone.");
}

deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
