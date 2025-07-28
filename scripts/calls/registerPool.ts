import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
const { ethers } = hre;

import { VaultExtension, VaultExtension__factory } from "../../typechain-types";
import { AddressZero, Zero } from "../../test/helpers";

// const TOKEN_ADDRESSES_SORTED = [ // ETHEREUM SEPOLIA
//     "0x03ffc595dB8d1f3558E94F6D1596F89695242643", // sorting by size (index 0)
//     "0x8113553820dAa1F852D32C3f7D97461f09012043", // sorting by size (index 1)
//     "0xD509688a2D8AAed688aEFfF6dd27bE97Eb10bD8D" // sorting by size (index 2)
// ];
const TOKEN_ADDRESSES = [
    // BASE SEPOLIA
    "0xbe7873DF7407b570bDe3406e50f76AB1A63b748b",
    "0x32081497f7b98A61C2Fdb41f37cC2f6E8D6ad163",
    "0xE1d44D28a9FbcD68FD1C3717681729EEb1961bB9"
];

// Sorting addresses by byte size (in ascending order)
const TOKEN_ADDRESSES_SORTED = [...TOKEN_ADDRESSES].sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase());
});
/**
 * "0x32081497f7b98A61C2Fdb41f37cC2f6E8D6ad163",
 * "0xbe7873DF7407b570bDe3406e50f76AB1A63b748b",
 * "0xE1d44D28a9FbcD68FD1C3717681729EEb1961bB9"
 */

console.log("Original addresses:", TOKEN_ADDRESSES);
console.log("Sorted addresses:", TOKEN_ADDRESSES_SORTED);

const VAULT_TEST_ADDRESS = "0xE0De5067454B2ce20cd74605C9D85b77bcE05DeD"; // BASE SEPOLIA
const STABLE_TEST_POOL_ADDRESS = "0x914d061Ec7A9aE41b00b7d499972E48eB9013883";

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
            rateProvider: AddressZero,
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
