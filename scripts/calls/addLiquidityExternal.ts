import * as dotenv from "dotenv";
dotenv.config();
import nodeConfig from "config";

import hre from "hardhat";
const { ethers, network } = hre;

const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;

import { HelperContract__factory } from "../../typechain-types";
import { GatewayEVM, GatewayEVM__factory, ZRC20__factory } from "../../test/helpers/types/contracts";
import { MaxUint256 } from "../../test/helpers";

/// ------- External Add Liquidity Script -------
// NOTE: Run this script with the command:
// $ npx hardhat run scripts/calls/addLiquidityExternal.ts --no-compile --network <network_name>
// NOTE: change the `network_name` in the hardhat.config
/// ---------------------------------------

const ROUTER_ADDRESS = "0xB4a9584e508E1dB7ebb8114573D39A69189CE1Ca";

const POOL_ADDRESSES: { [key: string]: string } = {
    uETH: "0x8c8b1538e753C053d96716e5063a6aD54A3dBa47",
    // uUSDC: "0x21B9f66E532eb8A2Fa5Bf6623aaa94857d77f1Cb" // old
    uUSDC: "0xCe83BFd5171237aF064A4C6203Ff3902D44fd4BD"
};
// NOTE: If you want to transfer native tokens, you should set the `TRANSFER_ERC20` variable to `false`.
const TRANSFER_ERC20 = true;
// NOTE: Set the amount of tokens to transfer without decimals.
const AMOUNT = "30";

async function main() {
    const [caller] = await ethers.getSigners();
    const currentNetwork = hre.network.name.toString();

    const gatewayAddress = nodeConfig.util.toObject(nodeConfig.get("gatewayEvmAddresses.networks"))[currentNetwork];
    const usdcAddress = nodeConfig.util.toObject(nodeConfig.get("usdcAddresses.networks"))[currentNetwork];

    console.log("\n --- Call info --- \n");
    console.log("* ", caller.address, "- Caller address");
    console.log("* ", gatewayAddress, "- Gateway address");
    console.log("* ", currentNetwork, "- Network name");
    console.log("\n --- ------- ---- --- ");

    // Connect to the GatewayEVM contract
    const gatewayEvmContract = GatewayEVM__factory.connect(gatewayAddress, caller);

    // NOTE: For this logic, we will use a completely empty structure.
    const revertOptions = {
        revertAddress: AddressZero, // << Address to receive revert.
        callOnRevert: false, // << Flag if onRevert hook should be called.
        abortAddress: AddressZero, // << Address to receive funds if aborted.
        revertMessage: HashZero, // << Arbitrary data sent back in onRevert.
        onRevertGasLimit: Zero // << Gas limit for revert tx, unused on GatewayZEVM methods
    };

    if (TRANSFER_ERC20) {
        // Connect to token contracts
        const tokenContract = ZRC20__factory.connect(usdcAddress, caller);
        const tokenSymbol = await tokenContract.symbol();
        const tokenDecimal = await tokenContract.decimals();

        // Check user balance of ERC20 token before the deposit
        const userBalanceBefore = await tokenContract.balanceOf(caller.address);
        if (userBalanceBefore.lt(parseUnits(AMOUNT, tokenDecimal))) {
            console.error(`\n ❌ Insufficient balance: ${formatUnits(userBalanceBefore, tokenDecimal)} ${tokenSymbol}`);
            return;
        }
        console.log(`User balance before deposit: ${formatUnits(userBalanceBefore, tokenDecimal)} ${tokenSymbol}`);

        // Approve the token to the Gateway contract if needed
        const allowance = await tokenContract.allowance(caller.address, gatewayAddress);
        if (allowance.lt(parseUnits(AMOUNT, tokenDecimal))) {
            const approveTx = await tokenContract
                .connect(caller)
                .approve(gatewayAddress, parseUnits(AMOUNT, tokenDecimal));
            await approveTx.wait(5);
            console.log(`\n✅ Approval TX hash: ${approveTx.hash}\n`);
        }

        const minBptAmountOut = Zero;
        // Encode the message to be sent
        const message = ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256"],
            [POOL_ADDRESSES.uUSDC, minBptAmountOut]
        );

        // Deposit token and call the Router contract on ZetaChain
        const tx = await gatewayEvmContract
            .connect(caller)
            ["depositAndCall(address,uint256,address,bytes,(address,bool,address,bytes,uint256))"](
                ROUTER_ADDRESS,
                parseUnits(AMOUNT, tokenDecimal),
                tokenContract.address,
                message,
                revertOptions
            );

        await tx.wait(5);
        // NOTE: Use the transaction hash to get the cross-chain transaction (CCTX) data.
        // NOTE: You can use the hardhat task `npx hardhat cctx-data --hash <tx.hash>`.
        console.log(`\n✅ Transfer TX hash: ${tx.hash}\n`);

        // Check user balance of ERC20 token after the deposit
        const userBalanceAfter = await tokenContract.balanceOf(caller.address);
        console.log(`User balance after deposit: ${formatUnits(userBalanceAfter, tokenDecimal)} ${tokenSymbol}`);
    } else {
        // Check user balance of native token before the deposit
        const userBalanceBefore = await ethers.provider.getBalance(caller.address);
        console.log(`User balance before deposit: ${formatEther(userBalanceBefore)} ETH or some native token`);

        const minBptAmountOut = Zero;
        // Encode the message to be sent
        const message = ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256"],
            [POOL_ADDRESSES.uETH, minBptAmountOut]
        );

        // Deposit native token and call the Router contract on ZetaChain
        const tx = await gatewayEvmContract
            .connect(caller)
            ["depositAndCall(address,bytes,(address,bool,address,bytes,uint256))"](
                ROUTER_ADDRESS,
                message,
                revertOptions,
                {
                    value: parseEther(AMOUNT)
                }
            );

        await tx.wait(5);
        console.log(`\n✅ Transfer TX hash: ${tx.hash}\n`);

        // Check user balance of native token after the deposit
        const userBalanceAfter = await ethers.provider.getBalance(caller.address);
        console.log(`User balance after deposit: ${formatEther(userBalanceAfter)} ETH or some native token`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
