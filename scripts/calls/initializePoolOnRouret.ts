import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";

const { ethers } = hre;
const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
import { Router, Router__factory, TestToken__factory, TestToken } from "../../typechain-types";
import { AddressZero, Zero, MaxUint256 } from "../../test/helpers";

// const TOKEN_ADDRESSES_SORTED = [ // ETHEREUM SEPOLIA
//     "0x03ffc595dB8d1f3558E94F6D1596F89695242643",
//     "0x8113553820dAa1F852D32C3f7D97461f09012043",
//     "0xD509688a2D8AAed688aEFfF6dd27bE97Eb10bD8D"
// ];
const TOKEN_ADDRESSES_SORTED = [ // BASE SEPOLIA
    "0x32081497f7b98A61C2Fdb41f37cC2f6E8D6ad163",
    "0xbe7873DF7407b570bDe3406e50f76AB1A63b748b",
    "0xE1d44D28a9FbcD68FD1C3717681729EEb1961bB9"
];

const ROUTER_TEST_ADDRESS = "0xF4E0F1b2D4096A03975C5eD9E71f1F82B8fF4B51"; // BASE SEPOLIA
const STABLE_TEST_POOL_ADDRESS = "0x914d061Ec7A9aE41b00b7d499972E48eB9013883"; // BASE SEPOLIA

async function main() {
    const [caller] = await ethers.getSigners();
    const networkName = hre.network.name.toString();

    const routerContract = Router__factory.connect(ROUTER_TEST_ADDRESS, caller) as Router;

    console.log("\n --- Initialize Pool on Router --- \n");
    console.log("* ", caller.address, "- Caller address");
    console.log("* ", networkName, "- Network name");
    console.log("* ", ROUTER_TEST_ADDRESS, "- Contract address");
    console.log("\n --- ------- ---- --- ");

    const initializeAmount = parseUnits("100", 18);

   // Approve tokens for the router
    for (const tokenAddress of TOKEN_ADDRESSES_SORTED) {
        const tokenContract = TestToken__factory.connect(tokenAddress, caller) as TestToken;
        const allowance = await tokenContract.allowance(caller.address, ROUTER_TEST_ADDRESS);
        if (allowance.lt(initializeAmount)) {
            const approvalTx = await tokenContract.approve(ROUTER_TEST_ADDRESS, MaxUint256);
            await approvalTx.wait();
            console.log(`Approved ${tokenAddress} tokens for the router.`);
        }
    }
    const initializePoolTx = await routerContract.initialize(
        STABLE_TEST_POOL_ADDRESS,
        TOKEN_ADDRESSES_SORTED,
        TOKEN_ADDRESSES_SORTED.map(() => initializeAmount),
        parseUnits("50", 18), // exact Bpt AmountOut
        false, // weth is eth
        "0x", // No additional user data
        { gasLimit: 5000000 }
    );

    await initializePoolTx.wait();

    console.log(`\n✅ Hash of Pool Initialization TX: ${initializePoolTx.hash}\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
