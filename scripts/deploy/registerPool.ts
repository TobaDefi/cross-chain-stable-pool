import * as dotenv from "dotenv";
dotenv.config();

import nodeConfig from "config";
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
import { AddressZero, Zero } from "../../test/helpers";

import deploymentBalancerContractAddrsJson from "./deployment-balancer-contract-addrs.json";

type ContractInfo = {
    address: string;
    deployedBlock: number;
    chainId: number;
};

type DeploymentBalancerContractAddrs = {
    [network: string]: {
        old: Record<string, unknown>;
        new: {
            VaultAdmin: ContractInfo;
            VaultExtension: ContractInfo;
            ProtocolFeeController: ContractInfo;
            Vault: ContractInfo;
            StablePool: ContractInfo;
        };
    };
};

const deploymentBalancerContractAddrs = deploymentBalancerContractAddrsJson as DeploymentBalancerContractAddrs;

const CONTRACT_NAMES = ["VaultAdmin", "VaultExtension", "ProtocolFeeController", "Vault", "StablePool"];
const FILE_NAME = "deployment-balancer-contract-addrs";
const PATH_TO_FILE = path.join(__dirname, `./${FILE_NAME}.json`);
const PAUSE_WINDOW_DURATION = 60 * 60 * 24 * 90; // 90 days in seconds
const BUFFER_PERIOD_DURATION = 60 * 60 * 24 * 30; // 30 days in seconds
const MINIMUM_TRADE_AMOUNT = 1e6;
const MINIMUM_WRAP_AMOUNT = 1e3;
const DEFAULT_AMP_FACTOR = 200;

const TOKEN_ADDRESSES_SORTED = [
  "0x03ffc595dB8d1f3558E94F6D1596F89695242643", // найменша
  "0x8113553820dAa1F852D32C3f7D97461f09012043", // середня
  "0xD509688a2D8AAed688aEFfF6dd27bE97Eb10bD8D"  // найбільша
];

async function deploy() {
    const [deployer] = await ethers.getSigners();
    const provider = ethers.provider;
    const chainId = await provider.getNetwork().then((network) => network.chainId);
    const networkName = hre.network.name.toString();
    // const contractAddress = deploymentBalancerContractAddrs[networkName].new.VaultExtension.address;
    const contractAddress = deploymentBalancerContractAddrs[networkName].new.Vault.address;

    const vaultExtensionContract = VaultExtension__factory.connect(contractAddress, deployer) as VaultExtension;

    console.log("\n --- Register Pool Data --- \n");
    console.log("* ", deployer.address, "- Caller address");
    console.log("* ", networkName, "- Network name");
    console.log("* ", contractAddress, "- Contract address");
    console.log("\n --- ------- ---- --- ");

    // console.log("\nDone.");

    enum TokenType {
        STANDARD = 0,
        WITH_RATE = 1
    }

    const tokenConfigs = [
        {
            token: TOKEN_ADDRESSES_SORTED[0],
            tokenType: TokenType.STANDARD,
            rateProvider: AddressZero,
            paysYieldFees: false
        },
        {
            token: TOKEN_ADDRESSES_SORTED[1],
            tokenType: TokenType.STANDARD,
            rateProvider: AddressZero, // AddressZero for STANDARD token
            paysYieldFees: false
        },
        {
            token: TOKEN_ADDRESSES_SORTED[2],
            tokenType: TokenType.STANDARD,
            rateProvider: AddressZero,
            paysYieldFees: false
        }
    ];

    const roleAccounts = {
        pauseManager: deployer.address,
        swapFeeManager: deployer.address,
        poolCreator: deployer.address
    };

    const liquidityManagement = {
        disableUnbalancedLiquidity: false,
        enableAddLiquidityCustom: false,
        enableRemoveLiquidityCustom: false,
        enableDonation: false
    };

    const registerPoolTx = await vaultExtensionContract.registerPool(
        deploymentBalancerContractAddrs[networkName].new.StablePool.address,
        tokenConfigs,
        1000000000000, // swapFeePercentage,
        Zero, // pauseWindowEndTime
        false, // protocolFeeExempt
        roleAccounts,
        AddressZero, // poolHooksContract
        liquidityManagement,
        {
            gasLimit: 5000000
        }
    );

    await registerPoolTx.wait();

    console.log(`\n✅ Hash of Pool Registration TX: ${registerPoolTx.hash}\n`);

}

deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
