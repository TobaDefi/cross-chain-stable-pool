import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
const { ethers, network } = hre;

const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;

import { Router, Router__factory, TestToken, TestToken__factory } from "../../typechain-types";
import { MaxUint256 } from "@uniswap/permit2-sdk";

const TOKEN_ADDRESSES_SORTED = [
    // BASE SEPOLIA
    "0x32081497f7b98A61C2Fdb41f37cC2f6E8D6ad163",
    "0xbe7873DF7407b570bDe3406e50f76AB1A63b748b",
    "0xE1d44D28a9FbcD68FD1C3717681729EEb1961bB9"
];
const NEW_TOKEN_ADDRESS = "0x30e7d25774507630733d1E277E7B664b1Dee757e";

const TOKEN_ADDRESSES = [...TOKEN_ADDRESSES_SORTED, NEW_TOKEN_ADDRESS];

const ROUTER_TEST_ADDRESS = "0xF4E0F1b2D4096A03975C5eD9E71f1F82B8fF4B51";
const STABLE_TEST_POOL_ADDRESS = "0x914d061Ec7A9aE41b00b7d499972E48eB9013883";

async function main() {
    const [caller] = await ethers.getSigners();
    const networkName = network.name.toString();

    console.log("\n --- Add Liquidity --- \n");
    console.log("* ", caller.address, "- Caller address");
    console.log("* ", networkName, "- Network name");
    console.log("* ", ROUTER_TEST_ADDRESS, "- Contract address");
    console.log("\n --- ------- ---- --- ");

    // Connect to the CompositeLiquidityRouter contract
    const routerContract = Router__factory.connect(ROUTER_TEST_ADDRESS, caller) as Router;

    const depositAmount = parseUnits("500", 18);

    // Approve tokens for the router
    for (const tokenAddress of TOKEN_ADDRESSES) {
        const tokenContract = TestToken__factory.connect(tokenAddress, caller) as TestToken;
        const allowance = await tokenContract.allowance(caller.address, ROUTER_TEST_ADDRESS);
        if (allowance.lt(depositAmount)) {
            const approvalTx = await tokenContract.approve(ROUTER_TEST_ADDRESS, MaxUint256);
            await approvalTx.wait();
            console.log(`Approved ${tokenAddress} tokens for the router.`);
        }
    }

    // Create the add liquidity transaction: proportional
    const addLiquidityProportionalTx = await routerContract.addLiquidityProportional(
        STABLE_TEST_POOL_ADDRESS,
        TOKEN_ADDRESSES.map(() => depositAmount),
        parseUnits("100", 18), // exact Bpt AmountOut
        false, // weth is eth
        "0x", // no additional user data
        { gasLimit: 5000000 }
    );

    await addLiquidityProportionalTx.wait();
    console.log(`\n✅ Add proportional liquidity transaction hash: ${addLiquidityProportionalTx.hash}\n`);

    // // Create the add liquidity transaction: unbalanced
    // const depositAmounts = [0, depositAmount, 0];
    // const addLiquidityUnbalancedTx = await routerContract.addLiquidityUnbalanced(
    //     STABLE_TEST_POOL_ADDRESS,
    //     depositAmounts,
    //     parseUnits("10", 18), // exact Bpt AmountOut
    //     false, // weth is eth
    //     "0x", // No additional user data
    //     { gasLimit: 5000000 }
    // );

    // await addLiquidityUnbalancedTx.wait();
    // console.log(`\n✅ Add unbalanced liquidity transaction hash: ${addLiquidityUnbalancedTx.hash}\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
