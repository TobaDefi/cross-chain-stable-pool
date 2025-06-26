import * as dotenv from "dotenv";
dotenv.config();

import { BigNumber, ethers, Wallet } from "ethers";
const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;


import { UniversalTokenSale__factory, UToken__factory } from "../../typechain-types";
import { GatewayEVM__factory, ZRC20__factory } from "../../test/helpers/types/contracts";


const PRIVATE_KEY: string = process.env.MAINNET_KEYS || "";

// Mainnet URLs
// const MAINNET_ZETA_URL = "https://zetachain-evm.blockpi.network/v1/rpc/public";

// Testnet URLs
const TESTNET_ZETA_URL = "https://zetachain-athens.g.allthatnode.com/archive/evm";
const TESTNET_BSC_URL = "https://bsc-testnet-rpc.publicnode.com";
const TESTNET_ETH_URL = "https://ethereum-sepolia-rpc.publicnode.com";

// All Gateway addresses from testnet
const GATEWAY_ZETA_ADDRESS = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
const GATEWAY_BSC_ADDRESS = "0x0c487a766110c85d301d96e33579c5b317fa4995";
const GATEWAY_ETH_ADDRESS = "0x0c487a766110c85d301d96e33579c5b317fa4995";
// Zetachain testnet UniversalTokenSale contract address
const TOKEN_SALE_ADDRESS = "0xab185b643FF5e46eF0699bdD0AbF33Bf2552B216";

// ZRC20 on ZetaChain for Native Tokens
const ZRC20_BNB_ADDRESS = "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891";
const ZRC20_ETH_ADDRESS = "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0";

// Connect to networks
const ethProvider = new ethers.providers.JsonRpcProvider(TESTNET_ETH_URL);
const bscProvider = new ethers.providers.JsonRpcProvider(TESTNET_BSC_URL);
const zetaProvider = new ethers.providers.JsonRpcProvider(TESTNET_ZETA_URL);
// Create a wallet instance using the private key
const walletOnBsc = new Wallet(PRIVATE_KEY, bscProvider);
const walletOnEth = new Wallet(PRIVATE_KEY, ethProvider);
const walletOnZeta = new Wallet(PRIVATE_KEY, zetaProvider);

// All wallets to connect by one private key
const userAddress = walletOnBsc.address;

async function main() {
    console.log(`User address: ${userAddress}\n`);

    // Connect to ZRC20 contracts
    const zrc20EthContract = ZRC20__factory.connect(ZRC20_ETH_ADDRESS, zetaProvider);
    const zrc20BnbContract = ZRC20__factory.connect(ZRC20_BNB_ADDRESS, zetaProvider);

    // Connect to the UniversalTokenSale contract
    const tokenSaleContract = UniversalTokenSale__factory.connect(TOKEN_SALE_ADDRESS, zetaProvider);
    // Connect to the Gateway contracts for BSC
    const gatewayBscContract = GatewayEVM__factory.connect(GATEWAY_BSC_ADDRESS, bscProvider);
    // Connect to the Gateway contracts for Ethereum
    const gatewayEthContract = GatewayEVM__factory.connect(GATEWAY_ETH_ADDRESS, ethProvider);

    /*
    /// @notice Struct containing revert options
    /// @param revertAddress Address to receive revert.
    /// @param callOnRevert Flag if onRevert hook should be called.
    /// @param abortAddress Address to receive funds if aborted.
    /// @param revertMessage Arbitrary data sent back in onRevert.
    /// @param onRevertGasLimit Gas limit for revert tx, unused on GatewayZEVM methods
    struct RevertOptions {
        address revertAddress;
        bool callOnRevert;
        address abortAddress;
        bytes revertMessage;
        uint256 onRevertGasLimit;
    }
    */
    // For this logic, we will use a completely empty structure.
    const revertOptions = {
        revertAddress: AddressZero, // << If set to AddressZero, the revert amount will be sent to the user address
        callOnRevert: false,
        abortAddress: AddressZero,
        revertMessage: HashZero, // << Or "0x" for empty message
        onRevertGasLimit: Zero // 
    };

    const depositAmount = parseEther("0.0001"); // Amount of ETH to deposit

    /*
    Encode the message to be sent
    For example, we can send the user address and the deposit amount
    const message = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [userAddress, depositAmount]
    );
    */
    // For this logic, we will use a completely empty message.
    const message = "0x";

    // Check balance of the UniversalTokenSale contract on ZetaChain network after the deposit
    const userBalanceBefore = await ethProvider.getBalance(userAddress);
    console.log(`User ETH balance before deposit: ${formatEther(userBalanceBefore)} ETH`);


    // Deposit and call the UniversalTokenSale contract on ZetaChain
    const tx = await gatewayEthContract.connect(walletOnEth)["depositAndCall(address,bytes,(address,bool,address,bytes,uint256))"](
        TOKEN_SALE_ADDRESS,
        message,
        revertOptions,
        {
            value: depositAmount,
        }
    );

    await tx.wait();
    // Use the transaction hash to get the cross-chain transaction (CCTX) data
    // You can use the hardhat task `npx hardhat cctx-data --hash <tx.hash>` or watched how to get CCTX data in the file `getCctxData.ts`
    console.log(`\n✅ Transaction hash: ${tx.hash}\n`);

    // Check balance of the UniversalTokenSale contract on ZetaChain network after the deposit
    const userBalanceAfter = await ethProvider.getBalance(userAddress);
    console.log(`User ETH balance after deposit: ${formatEther(userBalanceAfter)} ETH`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
