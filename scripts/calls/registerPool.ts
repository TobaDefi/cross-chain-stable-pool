import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
const { ethers, network } = hre;

import { VaultExtension, VaultExtension__factory } from "../../typechain-types";
import { AddressZero, Zero } from "../../test/helpers";

const TOKEN_ADDRESSES_SORTED = [
    "0x03ffc595dB8d1f3558E94F6D1596F89695242643", // sorting by size (index 0)
    "0x8113553820dAa1F852D32C3f7D97461f09012043", // sorting by size (index 1)
    "0xD509688a2D8AAed688aEFfF6dd27bE97Eb10bD8D" // sorting by size (index 2)
];

const VAULT_TEST_ADDRESS = "0xd48F8CF9198a969e6b730525862C2F2B0d8aD27B";
const STABLE_TEST_POOL_ADDRESS = "0xd75e75A2e83713497C0116227081B47493f26Ef9";

async function main() {
    const [deployer] = await ethers.getSigners();
    const networkName = hre.network.name.toString();

    const vaultExtensionContract = VaultExtension__factory.connect(VAULT_TEST_ADDRESS, deployer) as VaultExtension;

    console.log("\n --- Register Pool Data --- \n");
    console.log("* ", deployer.address, "- Caller address");
    console.log("* ", networkName, "- Network name");
    console.log("* ", VAULT_TEST_ADDRESS, "- Contract address");
    console.log("\n --- ------- ---- --- ");

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
        STABLE_TEST_POOL_ADDRESS,
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

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
