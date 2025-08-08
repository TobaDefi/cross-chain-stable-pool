import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
const { ethers, network } = hre;

const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;

import { Router, Router__factory, StablePool, StablePool__factory, TestToken, TestToken__factory } from "../../typechain-types";
import { MaxUint256 } from "@uniswap/permit2-sdk";

// const TOKEN_ADDRESSES_SORTED = [
//     // BASE SEPOLIA
//     "0x32081497f7b98A61C2Fdb41f37cC2f6E8D6ad163",
//     "0xbe7873DF7407b570bDe3406e50f76AB1A63b748b",
//     "0xE1d44D28a9FbcD68FD1C3717681729EEb1961bB9"
// ];
const TOKEN_ADDRESSES_SORTED = [
    // SEPOLIA
    "0x03ffc595dB8d1f3558E94F6D1596F89695242643",
    "0x8113553820dAa1F852D32C3f7D97461f09012043",
    "0xD509688a2D8AAed688aEFfF6dd27bE97Eb10bD8D"
];
// const NEW_TOKEN_ADDRESS = "0x30e7d25774507630733d1E277E7B664b1Dee757e";

// const TOKEN_ADDRESSES = [...TOKEN_ADDRESSES_SORTED, NEW_TOKEN_ADDRESS];

// const ROUTER_TEST_ADDRESS = "0xF4E0F1b2D4096A03975C5eD9E71f1F82B8fF4B51";
// const STABLE_TEST_POOL_ADDRESS = "0x914d061Ec7A9aE41b00b7d499972E48eB9013883";
const ROUTER_ADDRESS = "0xfF518a7211C9fC44D450858d301a570935F73BBd";
const STABLE_POOL_ADDRESS = "0x19288FB03a9ED741568eDF0898910CbCa1C7Ed86";
const VAULT_ADDRESS = "0x1C8df36391afBe880Ed566486f95F37D84c0CAd1"; 

async function main() {
    const [caller] = await ethers.getSigners();
    const networkName = network.name.toString();

    console.log("\n --- Add Liquidity --- \n");
    console.log("* ", caller.address, "- Caller address");
    console.log("* ", networkName, "- Network name");
    console.log("* ", ROUTER_ADDRESS, "- Contract address");
    console.log("\n --- ------- ---- --- ");

    // Connect to the CompositeLiquidityRouter contract
    const routerContract = Router__factory.connect(ROUTER_ADDRESS, caller) as Router;

    const minAmountsOut = parseUnits("1", 18);
    const exactBptAmountIn = parseUnits("10", 18); // Exact BPT amount to remove

    // Approve token for the router
    const stablePoolContract = StablePool__factory.connect(STABLE_POOL_ADDRESS, caller) as StablePool;
    const allowance = await stablePoolContract.allowance(caller.address, ROUTER_ADDRESS);
    if (allowance.lt(minAmountsOut)) {
        const approvalTx = await stablePoolContract.approve(ROUTER_ADDRESS, MaxUint256);
        await approvalTx.wait();
        console.log(`Approved ${STABLE_POOL_ADDRESS} tokens for the router.`);
    }

    // // Create the remove liquidity transaction: proportional
    // const removeLiquidityProportionalTx = await routerContract.removeLiquidityProportional(
    //     STABLE_POOL_ADDRESS,
    //     exactBptAmountIn,
    //     TOKEN_ADDRESSES_SORTED.map(() => minAmountsOut),
    //     false, // weth is eth
    //     HashZero, // No additional user data
    //     { gasLimit: 5000000 }
    // );

    // await removeLiquidityProportionalTx.wait();
    // console.log(`\n✅ Remove proportional liquidity transaction hash: ${removeLiquidityProportionalTx.hash}\n`);

    // Create the remove liquidity transaction: unbalanced
    const removeLiquidityUnbalancedTx = await routerContract["removeLiquiditySingleTokenExactIn(address,uint256,uint256,uint256,bool,bytes)"](
        STABLE_POOL_ADDRESS,
        exactBptAmountIn,
        TOKEN_ADDRESSES_SORTED[0],
        minAmountsOut,
        false, // weth is eth
        HashZero, // No additional user data
        { gasLimit: 5000000 }
    );

    await removeLiquidityUnbalancedTx.wait();
    console.log(`\n✅ Remove unbalanced liquidity transaction hash: ${removeLiquidityUnbalancedTx.hash}\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
