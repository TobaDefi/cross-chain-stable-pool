import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
const { ethers } = hre;
import { VoidSigner } from "ethers";
const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { BigNumber } = ethers;
const { Zero, AddressZero, HashZero } = ethers.constants;

import { Router, Router__factory, StablePool__factory, StablePool } from "../../typechain-types";
import { ZRC20__factory, ZRC20 } from "../../test/helpers/types/contracts";

import { MaxUint256 } from "@uniswap/permit2-sdk";

/// ------- Add Liquidity Proportional Script -------
// NOTE: Run this script with the command:
// $ npx hardhat run scripts/calls/addLiquidityProportional.ts --no-compile --network zeta_testnet
/// ---------------------------------------

const ROUTER_ADDRESS = "0xB4a9584e508E1dB7ebb8114573D39A69189CE1Ca"; // << new address

const POOL_ADDRESSES: { [key: string]: string } = {
    uETH: "0x8c8b1538e753C053d96716e5063a6aD54A3dBa47",
    uUSDC: "0xCe83BFd5171237aF064A4C6203Ff3902D44fd4BD"
};

// NOTE: Change this to the pool you want to add liquidity to
const CURRENT_POOL = "uETH";
// NOTE: Set the exact BPT amount to receive for add proportional liquidity
const EXACT_BPT_AMOUNT_OUT = "0.01";

async function main() {
    const [caller] = await ethers.getSigners();
    const currentNetwork = hre.network.name.toString();
    const provider = ethers.provider;

    const zero = new VoidSigner(AddressZero, provider);

    // Connect to the CompositeLiquidityRouter contract
    const routerContract = Router__factory.connect(ROUTER_ADDRESS, provider) as Router;
    // Connect to the StablePool contract
    const poolContract = StablePool__factory.connect(POOL_ADDRESSES[CURRENT_POOL], provider) as StablePool;
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
            .callStatic.queryAddLiquidityProportional(
                POOL_ADDRESSES[CURRENT_POOL],
                parseUnits(EXACT_BPT_AMOUNT_OUT, poolDecimal),
                zero.address,
                HashZero
            );
    } catch (error) {
        console.error("❌ Error querying add liquidity proportional:", error);
        return;
    }

    const tokenAmountsIn = queryTx;

    const userBalancesBefore = [];
    const tokenContracts: ZRC20[] = [];
    const tokenData: { decimals: number; symbol: string }[] = [];

    for (const [index, tokenAddress] of tokenAddresses.entries()) {
        // Connect to token contracts
        const tokenContract = ZRC20__factory.connect(tokenAddress, caller);
        tokenContracts.push(tokenContract);
        const tokenSymbol = await tokenContract.symbol();
        const tokenDecimal = await tokenContract.decimals();
        tokenData.push({ decimals: tokenDecimal, symbol: tokenSymbol });
        // Check user balance of ERC20 token before the add liquidity
        const userBalanceBefore = await tokenContract.balanceOf(caller.address);
        userBalancesBefore.push(userBalanceBefore);

        if (userBalanceBefore.lt(tokenAmountsIn[index])) {
            console.error(
                `\n ❌ Insufficient balance: ${formatUnits(userBalanceBefore, tokenData[index].decimals)} ${
                    tokenData[index].symbol
                }`
            );
            return;
        } else {
            console.log(
                `\nUser balance before add liquidity: ${formatUnits(
                    userBalancesBefore[index],
                    tokenData[index].decimals
                )} ${tokenData[index].symbol}`
            );
        }

        // Approve the token to the Router contract if needed
        const allowance = await tokenContract.allowance(caller.address, routerContract.address);
        if (allowance.lt(tokenAmountsIn[index])) {
            const approveTx = await tokenContract.connect(caller).approve(routerContract.address, MaxUint256);
            await approveTx.wait(5);
            console.log(`\n✅ Approval TX hash: ${approveTx.hash}`);
        }
    }

    const balanceLPBefore = await poolContract.balanceOf(caller.address);
    console.log(`\nUser balance of ${poolSymbol} before add liquidity: ${formatUnits(balanceLPBefore, poolDecimal)}`);

    // Create the add liquidity transaction: proportional
    const addLiquidityProportionalTx = await routerContract.addLiquidityProportional(
        POOL_ADDRESSES[CURRENT_POOL],
        tokenAmountsIn.map((amount) => amount.mul(102).div(100)), // Add 2% slippage to each token amount
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
