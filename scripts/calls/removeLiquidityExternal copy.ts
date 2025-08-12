import * as dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
const { ethers } = hre;

const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;

import { Router, Router__factory, StablePool__factory, StablePool } from "../../typechain-types";
import { ZRC20__factory, ZRC20 } from "../../test/helpers/types/contracts";

import { MaxUint256 } from "@uniswap/permit2-sdk";

const ROUTER_ADDRESS = "0xB4a9584e508E1dB7ebb8114573D39A69189CE1Ca"; // << new address

const POOL_ADDRESSES: { [key: string]: string } = {
    uETH: "0x8c8b1538e753C053d96716e5063a6aD54A3dBa47",
    uUSDC: "0x21B9f66E532eb8A2Fa5Bf6623aaa94857d77f1Cb"
};
// NOTE: Change this to the pool you want to add liquidity to
const CURRENT_POOL = "uUSDC";
// NOTE: Set the exact BPT amount to receive for add proportional liquidity
const EXACT_BPT_AMOUNT_IN = "20";
// NOTE: Set the chain ID for the deposit network
// const CHAIN_ID = 421614; // << Arbitrum Sepolia Chain ID
const CHAIN_ID = 84532; // << Base Sepolia Chain ID
// const CHAIN_ID = 11155111; // << Sepolia Chain ID

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
    }

    console.log(
        `\nUser balance of ${poolSymbol} before remove liquidity: ${formatUnits(balanceLPBefore, poolDecimal)}`
    );

    // const approvalTx = await poolContract.approve(ROUTER_ADDRESS, Zero);
    // await approvalTx.wait(5);
    // const allowance = await poolContract.allowance(caller.address, ROUTER_ADDRESS);
    // console.log(`\n Allowance after approval: ${formatUnits(allowance, poolDecimal)}`);

    // Перевіримо стан пулу спочатку
    try {
        console.log("Checking pool initialization...");
        
        // Спробуємо отримати токени пулу напряму з пулу
        const poolTokensFromPool = await poolContract.getTokens();
        console.log("Pool tokens from pool contract:", poolTokensFromPool);
        
        // Перевіримо чи пул ініціалізований
        const totalSupply = await poolContract.totalSupply();
        console.log("Pool total supply:", formatUnits(totalSupply, poolDecimal));
        
        if (totalSupply.eq(Zero)) {
            console.log("❌ Pool is not initialized (total supply is 0)");
            return;
        }
        
    } catch (error) {
        console.error("Error checking pool state:", error);
        return;
    }

    try {
        console.log("Attempting query with Router...");
        const queryTx = await routerContract.callStatic.queryRemoveLiquidityProportional(
            POOL_ADDRESSES[CURRENT_POOL],
            parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal),
            caller.address,
            HashZero
        );

        console.log(`\nQuery remove liquidity proportional result: ${queryTx}`);
    } catch (error: any) {
        console.error("Query failed with Router:", error.message);
        
        // Якщо Router не працює, спробуємо напряму викликати Vault
        try {
            console.log("Trying direct approach via Vault...");
            
            // Використовуємо правильну адресу Vault
            const vaultAddress = "0x1541CA9df8774D72Bc2f56DE44f5C019Cea4F180"; // ZetaChain testnet Vault
            
            const vaultContract = new ethers.Contract(
                vaultAddress,
                [
                    "function isQueryDisabled() external view returns (bool)",
                    "function isQueryDisabledPermanently() external view returns (bool)",
                    "function quote(bytes calldata data) external returns (bytes memory result)"
                ],
                caller
            );
            
            // Перевіримо статус queries
            const isQueryDisabled = await vaultContract.callStatic.isQueryDisabled();
            const isQueryDisabledPermanently = await vaultContract.callStatic.isQueryDisabledPermanently();
            
            console.log("Query disabled:", isQueryDisabled);
            console.log("Query disabled permanently:", isQueryDisabledPermanently);
            
    // Спробуємо альтернативний спосіб - симулювати фактичну транзакцію
    try {
        console.log("Trying simulation via actual transaction...");
        
        const minAmountsOut = tokenAddresses.map(() => "1"); // мінімальні суми
        
        // Симулюємо через estimateGas або використаємо дуже маленьку суму для тестування
        const smallAmount = parseUnits("0.1", poolDecimal); // Невелика сума для тестування
        
        const estimatedGas = await routerContract.estimateGas.removeLiquidityProportional(
            POOL_ADDRESSES[CURRENT_POOL],
            smallAmount,
            minAmountsOut,
            false,
            HashZero
        );
        
        console.log("Estimated gas for small removal:", estimatedGas.toString());
        console.log("✅ Transaction would succeed!");
        
        // Оскільки це пропорційне видалення, ми можемо обчислити пропорцію
        const poolTotalSupply = await poolContract.totalSupply();
        const ratio = parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal).mul(ethers.constants.WeiPerEther).div(poolTotalSupply);
        
        console.log("Withdrawal ratio:", formatEther(ratio));
        
        // Отримаємо баланси токенів в пулі
        const vaultAddress = "0x1541CA9df8774D72Bc2f56DE44f5C019Cea4F180";
        const vaultContract = new ethers.Contract(
            vaultAddress,
            ["function getCurrentLiveBalances(address pool) external view returns (uint256[] memory)"],
            caller
        );
        
        const poolBalances = await vaultContract.callStatic.getCurrentLiveBalances(POOL_ADDRESSES[CURRENT_POOL]);
        console.log("Pool balances:", poolBalances.map((balance: any, index: number) => 
            `Token ${index}: ${formatEther(balance)}`
        ));
        
        // Обчислюємо орієнтовні суми токенів, які отримаємо
        const expectedAmounts = poolBalances.map((balance: any) => 
            balance.mul(ratio).div(ethers.constants.WeiPerEther)
        );
        
        console.log("Expected token amounts for withdrawal:");
        expectedAmounts.forEach((amount: any, index: number) => {
            console.log(`Token ${index}: ${formatEther(amount)}`);
        });
        
    } catch (simError: any) {
        console.error("Simulation also failed:", simError.message);
        console.log("The transaction might fail due to slippage or other constraints");
    }
            
        } catch (altError: any) {
            console.error("Alternative approach also failed:", altError.message);
            console.log("This might indicate that the pool or vault has issues, or queries are disabled");
        }
    }

    // const minAmountOut = "1";
    // // Create the remove liquidity transaction: unbalanced
    // const removeLiquidityUnbalancedTx = await routerContract[
    //     "removeLiquiditySingleTokenExactIn(address,uint256,uint256,uint256,bool,bytes)"
    // ](
    //     POOL_ADDRESSES[CURRENT_POOL],
    //     parseUnits(EXACT_BPT_AMOUNT_IN, poolDecimal),
    //     CHAIN_ID, // << Chain ID for the deposit network
    //     minAmountOut,
    //     false, // << weth is eth
    //     HashZero, // << No additional user data
    //     {
    //         gasLimit: 5000000 // << Gas limit for the transaction
    //     }
    // );
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
