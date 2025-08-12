import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
const { ethers } = hre;

import { VoidSigner } from "ethers";
// import { Signer } from 'ethers';

const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;

import { Router, Router__factory, StablePool__factory, StablePool } from "../../typechain-types";
import { ZRC20__factory, ZRC20 } from "../../test/helpers/types/contracts";

import { MaxUint256 } from "@uniswap/permit2-sdk";
import { token } from "../../typechain-types/@openzeppelin/contracts";

// const ROUTER_ADDRESS = "0x997834A5F0c437757f96Caf33f28A617A8C7f340"; // << old address
const ROUTER_ADDRESS = "0xB4a9584e508E1dB7ebb8114573D39A69189CE1Ca"; // << new address

const POOL_ADDRESSES: { [key: string]: string } = {
    uETH: "0x8c8b1538e753C053d96716e5063a6aD54A3dBa47",
    uUSDC: "0x21B9f66E532eb8A2Fa5Bf6623aaa94857d77f1Cb"
};
// NOTE: Change this to the pool you want to add liquidity to
const CURRENT_POOL = "uETH";
// NOTE: Set the exact BPT amount to receive for add proportional liquidity
const EXACT_BPT_AMOUNT_IN = "0.01";
// NOTE: Set the chain ID for the deposit network
// const CHAIN_ID = 421614; // << Arbitrum Sepolia Chain ID
const CHAIN_ID = 84532; // << Base Sepolia Chain ID
// const CHAIN_ID = 11155111; // << Sepolia Chain ID

async function main() {
    const [caller] = await ethers.getSigners();
    const currentNetwork = hre.network.name.toString();
    const provider = ethers.provider;

    // const  zero = new VoidSigner('0x0000000000000000000000000000000000000000', ethers.provider);
    const zero = new VoidSigner(AddressZero, ethers.provider);
    // const  zero = new Signer(AddressZero, ethers.provider);

    // Connect to the CompositeLiquidityRouter contract
    const routerContract = Router__factory.connect(ROUTER_ADDRESS, provider) as Router;
    // Connect to the StablePool contract
    const poolContract = StablePool__factory.connect(POOL_ADDRESSES[CURRENT_POOL], caller) as StablePool;
    const poolDecimal = await poolContract.decimals();
    const poolSymbol = await poolContract.symbol();
    // Get the token addresses from the pool
    const tokenAddresses = await poolContract.getTokens();

    console.log("\n --- Call info --- \n");
    console.log("* ", caller.address, "- Caller address");
    console.log("* ", routerContract.address, "- Router address");
    console.log("* ", poolContract.address, "- Pool address");
    console.log("* ", currentNetwork, "- Network name");
    console.log("\n --- ------- ---- --- ");

    let queryTx;

    try {
        queryTx = await routerContract
            .connect(zero)
            .callStatic.queryRemoveLiquidityProportional(
                POOL_ADDRESSES[CURRENT_POOL],
                parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal),
                zero.address,
                HashZero
            );

        console.log(`\n✅ Query remove liquidity proportional result: ${queryTx}`);
    } catch (error) {
        console.error("❌ Error querying remove liquidity proportional:", error);
        return;
    }

    // Approve token for the router
    const allowance = await poolContract.allowance(caller.address, ROUTER_ADDRESS);
    if (allowance.lt(parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal))) {
        const approvalTx = await poolContract.approve(ROUTER_ADDRESS, MaxUint256);
        await approvalTx.wait();
        console.log(`\n✅ Approval TX hash: ${approvalTx.hash}`);
    }

    const balanceLPBefore = await poolContract.balanceOf(caller.address);

    if (balanceLPBefore.lt(parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal))) {
        console.error(`\n ❌ Insufficient balance: ${formatUnits(balanceLPBefore, poolDecimal)} ${poolSymbol}`);
        return;
    } else {
        console.log(
            `\nUser balance of ${poolSymbol} before remove liquidity: ${formatUnits(balanceLPBefore, poolDecimal)}`
        );
    }

    const minAmountOut = "1";
    // Create the remove liquidity transaction: unbalanced
    const removeLiquidityUnbalancedTx = await routerContract[
        "removeLiquiditySingleTokenExactIn(address,uint256,uint256,uint256,bool,bytes)"
    ](
        POOL_ADDRESSES[CURRENT_POOL],
        parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal),
        CHAIN_ID, // << Chain ID for the deposit network
        minAmountOut,
        false, // << weth is eth
        HashZero, // << No additional user data
        {
            gasLimit: 5000000 // << Gas limit for the transaction
        }
    );

    await removeLiquidityUnbalancedTx.wait();
    console.log(`\n✅ Remove unbalanced liquidity transaction hash: ${removeLiquidityUnbalancedTx.hash}\n`);

    const balanceLPAfters = await poolContract.balanceOf(caller.address);
    console.log(`\nUser balance of ${poolSymbol} after remove liquidity: ${formatUnits(balanceLPAfters, poolDecimal)}`);

    // const removeLiquidityUnbalancedTx = await routerContract[
    //     "removeLiquiditySingleTokenExactIn(address,uint256,address,uint256,bool,bytes)"
    // ](
    //     POOL_ADDRESSES[CURRENT_POOL],
    //     parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal),
    //     tokenAddresses[2], // << Chain ID for the deposit network
    //     minAmountOut,
    //     false, // << weth is eth
    //     HashZero, // << No additional user data
    //     {
    //         gasLimit: 5000000 // << Gas limit for the transaction
    //     }
    // );
    // const removeLiquidityUnbalancedTx = await routerContract.removeLiquiditySingleTokenExactOut(
    //     POOL_ADDRESSES[CURRENT_POOL],
    //     parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal),
    //     tokenAddresses[2], // << Chain ID for the deposit network
    //     parseUnits("0.01", poolDecimal),
    //     false, // << weth is eth
    //     HashZero, // << No additional user data
    //     {
    //         gasLimit: 5000000 // << Gas limit for the transaction
    //     }
    // );
    // const removeLiquidityUnbalancedTx = await routerContract.removeLiquidityProportional(
    //     POOL_ADDRESSES[CURRENT_POOL],
    //     parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal),
    //     tokenAddresses.map(() => minAmountOut),
    //     false, // << weth is eth
    //     HashZero, // << No additional user data
    //     {
    //         gasLimit: 5000000 // << Gas limit for the transaction
    //     }
    // );

    // await removeLiquidityUnbalancedTx.wait();
    // console.log(`\n✅ Remove unbalanced liquidity transaction hash: ${removeLiquidityUnbalancedTx.hash}\n`);

    // const balanceLPAfters = await poolContract.balanceOf(caller.address);
    // console.log(`\nUser balance of ${poolSymbol} after remove liquidity: ${formatUnits(balanceLPAfters, poolDecimal)}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
