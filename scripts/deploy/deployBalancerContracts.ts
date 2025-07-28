import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
import path from "path";
import { getAddressSaver, verify } from "./utils/helpers";
const { ethers, network } = hre;

import { TransactionReceipt } from "@ethersproject/abstract-provider";

import {
    VaultAdmin,
    VaultAdmin__factory,
    VaultExtension,
    VaultExtension__factory,
    ProtocolFeeController,
    ProtocolFeeController__factory,
    Vault,
    Vault__factory,
    StablePool,
    StablePool__factory
} from "../../typechain-types";


const CONTRACT_NAMES = ["VaultAdmin", "VaultExtension", "ProtocolFeeController", "Vault", "StablePool"];
const FILE_NAME = "deployment-balancer-contract-addrs";
const PATH_TO_FILE = path.join(__dirname, `./${FILE_NAME}.json`);

const PAUSE_WINDOW_DURATION = 60 * 60 * 24 * 90; // 90 days in seconds
const BUFFER_PERIOD_DURATION = 60 * 60 * 24 * 30; // 30 days in seconds
const MINIMUM_TRADE_AMOUNT = 1e6;
const MINIMUM_WRAP_AMOUNT = 1e3;
const DEFAULT_AMP_FACTOR = 200;

async function deploy() {
    const [deployer] = await ethers.getSigners();
    const provider = ethers.provider;
    const chainId = await provider.getNetwork().then((network) => network.chainId);

    console.log("\n --- Deployed data --- \n");
    console.log("* ", deployer.address, "- Deployer address");
    console.log("* ", hre.network.name, "- Network name");
    console.log("* ", CONTRACT_NAMES, "- Contract names");
    console.log("\n --- ------- ---- --- ");

    const futureVaultAddress = ethers.Contract.getContractAddress({
        from: deployer.address,
        nonce: (await deployer.getTransactionCount()) + 3 // VaultAdmin, VaultExtension, ProtocolFeeController, Vault
    });

    console.log(`✅ Future Vault address: ${futureVaultAddress}`);

    const contractAddresses: string[] = [];
    const contractArgs: any[] = [];
    const deployTxs: Promise<TransactionReceipt>[] = [];

    const vaultAdmin = (await ethers.getContractFactory(CONTRACT_NAMES[0], deployer)) as VaultAdmin__factory;
    const vaultAdminContract: VaultAdmin = await vaultAdmin
        .connect(deployer)
        .deploy(
            futureVaultAddress,
            PAUSE_WINDOW_DURATION,
            BUFFER_PERIOD_DURATION,
            MINIMUM_TRADE_AMOUNT,
            MINIMUM_WRAP_AMOUNT
        );

    const deployTx1 = (await vaultAdminContract.deployed()).deployTransaction.wait();
    deployTxs.push(deployTx1);
    contractArgs.push([
        futureVaultAddress,
        PAUSE_WINDOW_DURATION,
        BUFFER_PERIOD_DURATION,
        MINIMUM_TRADE_AMOUNT,
        MINIMUM_WRAP_AMOUNT
    ]);
    contractAddresses.push(vaultAdminContract.address);
    console.log(`\n✅ Hash of TX #1: ${(await deployTx1).transactionHash}\n`);

    const vaultExtension = new VaultExtension__factory(deployer);
    const vaultExtensionContract: VaultExtension = await vaultExtension
        .connect(deployer)
        .deploy(futureVaultAddress, vaultAdminContract.address);

    const deployTx2 = (await vaultExtensionContract.deployed()).deployTransaction.wait();
    deployTxs.push(deployTx2);
    contractArgs.push([futureVaultAddress, vaultAdminContract.address]);
    contractAddresses.push(vaultExtensionContract.address);
    console.log(`\n✅ Hash of TX #2: ${(await deployTx2).transactionHash}\n`);

    const protocolFeeController = new ProtocolFeeController__factory(deployer);
    const protocolFeeControllerContract: ProtocolFeeController = await protocolFeeController.connect(deployer).deploy(
        futureVaultAddress,
        0, // protocol fee percentage
        0 // protocol fee collector
    );

    const deployTx3 = (await protocolFeeControllerContract.deployed()).deployTransaction.wait();
    deployTxs.push(deployTx3);
    contractArgs.push([futureVaultAddress, 0, 0]);
    contractAddresses.push(protocolFeeControllerContract.address);
    console.log(`\n✅ Hash of TX #3: ${(await deployTx3).transactionHash}\n`);

    const vault = new Vault__factory(deployer);
    const vaultContract: Vault = await vault
        .connect(deployer)
        .deploy(vaultExtensionContract.address, vaultAdminContract.address, protocolFeeControllerContract.address);

    const deployTx4 = (await vaultContract.deployed()).deployTransaction.wait();
    deployTxs.push(deployTx4);
    contractArgs.push([
        vaultExtensionContract.address,
        vaultAdminContract.address,
        protocolFeeControllerContract.address
    ]);
    contractAddresses.push(vaultContract.address);
    console.log(`\n✅ Hash of TX #4: ${(await deployTx4).transactionHash}\n`);

    const stablePool = new StablePool__factory(deployer);
    const stablePoolContract: StablePool = await stablePool.connect(deployer).deploy(
        {
            name: "Stable Pool",
            symbol: "STABLE",
            amplificationParameter: DEFAULT_AMP_FACTOR,
            version: "1.0.0"
        },
        vaultContract.address
    );

    const deployTx5 = (await stablePoolContract.deployed()).deployTransaction.wait();
    deployTxs.push(deployTx5);
    contractArgs.push([
        { name: "Stable Pool", symbol: "STABLE", amplificationParameter: DEFAULT_AMP_FACTOR, version: "1.0.0" },
        vaultContract.address
    ]);
    contractAddresses.push(stablePoolContract.address);
    console.log(`\n✅ Hash of TX #5: ${(await deployTx5).transactionHash}\n`);

    const saveAddress = getAddressSaver(PATH_TO_FILE, network.name, true);
    for (let i = 0; i < contractAddresses.length; i++) {
        const deployTransaction = await ethers.provider.getTransactionReceipt((await deployTxs[i]).transactionHash);
        saveAddress(
            CONTRACT_NAMES[i],
            {
                address: contractAddresses[i],
                deployedBlock: deployTransaction.blockNumber,
                chainId: chainId
            },
            false
        );
    }

    console.log(
        `\nDeployment is completed:\n` +
            `- ${CONTRACT_NAMES[0]}: ${vaultAdminContract.address}|\n` +
            `- ${CONTRACT_NAMES[1]}: ${vaultExtensionContract.address}|\n` +
            `- ${CONTRACT_NAMES[2]}: ${protocolFeeControllerContract.address}|\n` +
            `- ${CONTRACT_NAMES[3]}: ${vaultContract.address}|\n` +
            `- ${CONTRACT_NAMES[4]}: ${stablePoolContract.address}|\n`
    );

    // Verify contracts
    for (let i = 0; i < contractAddresses.length; i++) {
        await verify(contractAddresses[i], [...contractArgs[i]]);
    }


    console.log(`Done. All contracts are deployed.`);
}

deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
