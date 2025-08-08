import * as dotenv from "dotenv";
dotenv.config();
import nodeConfig from "config";

import hre from "hardhat";
const { ethers } = hre;

const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;

import { HelperContract__factory } from "../../typechain-types";
import { GatewayEVM, GatewayEVM__factory, ZRC20__factory } from "../../test/helpers/types/contracts";
import { MaxUint256 } from "../../test/helpers";

/// ------- Helper Transfer Script -------
// NOTE: Run this script with the command:
// $ npx hardhat run scripts/calls/helperTransfer.ts --no-compile --network <network_name>
// NOTE: change the `network_name` in the hardhat.config
/// ---------------------------------------

const HELPER_CONTRACT_ADDRESS = "0x5E6A4483E81aC09181813Bc2A1645f3951BDdF0B";
// NOTE: If you want to transfer native tokens, you should set the `TRANSFER_ERC20` variable to `false`.
const TRANSFER_ERC20 = false;
// NOTE: If you want to transfer non-USDC tokens, you should change set the `someTokenAddress` variable
// to the address of the token you want to transfer.
const SOME_TOKEN_ADDRESS = null;
// NOTE: Set the amount of tokens to transfer without decimals.
const AMOUNT = "0.001";

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
        const tokenContract = ZRC20__factory.connect(SOME_TOKEN_ADDRESS ? SOME_TOKEN_ADDRESS : usdcAddress, caller);
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

        // Deposit token and call the Helper contract on ZetaChain
        const tx = await gatewayEvmContract
            .connect(caller)
            ["depositAndCall(address,uint256,address,bytes,(address,bool,address,bytes,uint256))"](
                HELPER_CONTRACT_ADDRESS,
                parseUnits(AMOUNT, tokenDecimal),
                tokenContract.address,
                HashZero, // << For this logic, we will use a completely empty message.
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

        // Deposit native token and call the Helper contract on ZetaChain
        const tx = await gatewayEvmContract
            .connect(caller)
            ["depositAndCall(address,bytes,(address,bool,address,bytes,uint256))"](
                HELPER_CONTRACT_ADDRESS,
                HashZero, // << For this logic, we will use a completely empty message.
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
