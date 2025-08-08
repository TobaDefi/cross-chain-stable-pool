import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
const { ethers } = hre;

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
const EXACT_BPT_AMOUNT_OUT = "0.01";

async function main() {
    const [caller] = await ethers.getSigners();
    const currentNetwork = hre.network.name.toString();

    // Connect to the CompositeLiquidityRouter contract
    const routerContract = Router__factory.connect(ROUTER_ADDRESS, caller) as Router;
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

    const userBalancesBefore = [];
    const tokenContracts: ZRC20[] = [];
    const tokenData: { decimals: number; symbol: string }[] = [];

    for (const tokenAddress of tokenAddresses) {
        // Connect to token contracts
        const tokenContract = ZRC20__factory.connect(tokenAddress, caller);
        tokenContracts.push(tokenContract);
        const tokenSymbol = await tokenContract.symbol();
        const tokenDecimal = await tokenContract.decimals();
        tokenData.push({ decimals: tokenDecimal, symbol: tokenSymbol });
        // // Check user balance of ERC20 token before the deposit
        const userBalanceBefore = await tokenContract.balanceOf(caller.address);
        userBalancesBefore.push(userBalanceBefore);
        // Approve the token to the Router contract if needed
        const allowance = await tokenContract.allowance(caller.address, routerContract.address);
        if (allowance.lt(userBalanceBefore)) {
            const approveTx = await tokenContract.connect(caller).approve(routerContract.address, MaxUint256);
            await approveTx.wait(5);
            console.log(`\n✅ Approval TX hash: ${approveTx.hash}`);
        }
    }

    // Get the amounts of tokens to add liquidity
    const tokenAmounts = await routerContract.callStatic.addLiquidityProportional(
        POOL_ADDRESSES[CURRENT_POOL],
        tokenAddresses.map(() => parseUnits(EXACT_BPT_AMOUNT_OUT, poolDecimal)),
        parseUnits(EXACT_BPT_AMOUNT_OUT, poolDecimal),
        false, // << weth is eth
        HashZero // << No additional user data
    );

    for (const [index, tokenAmount] of tokenAmounts.entries()) {
        // Check user balance of ERC20 token before the add liquidity

        if (userBalancesBefore[index].lt(tokenAmount)) {
            console.error(
                `\n ❌ Insufficient balance: ${formatUnits(userBalancesBefore[index], tokenData[index].decimals)} ${
                    tokenData[index].symbol
                }`
            );
            return;
        }
        console.log(
            `\nUser balance before add liquidity: ${formatUnits(
                userBalancesBefore[index],
                tokenData[index].decimals
            )} ${tokenData[index].symbol}`
        );
    }

    const balanceLPBefore = await poolContract.balanceOf(caller.address);
    console.log(`\nUser balance of ${poolSymbol} before add liquidity: ${formatUnits(balanceLPBefore, poolDecimal)}`);

    // Create the add liquidity transaction: proportional
    const addLiquidityProportionalTx = await routerContract.addLiquidityProportional(
        POOL_ADDRESSES[CURRENT_POOL],
        tokenAmounts.map((amount) => amount.mul(2)), // Add 100% more to the amounts
        parseUnits(EXACT_BPT_AMOUNT_OUT, await poolContract.decimals()),
        false, // << weth is eth
        HashZero // << No additional user data
    );

    await addLiquidityProportionalTx.wait(5);
    console.log(`\n✅ Add proportional liquidity transaction hash: ${addLiquidityProportionalTx.hash}\n`);

    const balanceLPAfters = await poolContract.balanceOf(caller.address);
    console.log(`\nUser balance of ${poolSymbol} after add liquidity: ${formatUnits(balanceLPAfters, poolDecimal)}`);

    for (const [index, tokenContract] of tokenContracts.entries()) {
        const userBalanceAfter = await tokenContract.balanceOf(caller.address);
        console.log(
            `\nUser balance after add liquidity: ${formatUnits(userBalanceAfter, tokenData[index].decimals)} ${
                tokenData[index].symbol
            }`
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
