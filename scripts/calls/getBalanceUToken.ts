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
const UTOKEN_ADDRESS = "0x773EEa2ce35E22202Efa1cFc1503Bc6E4CaE1eb6";

// ZRC20 on ZetaChain for Native Tokens
const ZRC20_BNB_ADDRESS = "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891";
const ZRC20_ETH_ADDRESS = "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0";

// Connect to networks
const ethProvider = new ethers.providers.JsonRpcProvider(TESTNET_ETH_URL);
const bscProvider = new ethers.providers.JsonRpcProvider(TESTNET_BSC_URL);
const zetaProvider = new ethers.providers.JsonRpcProvider(TESTNET_ZETA_URL);
// Create a wallet instance using the private key
const walletOnZeta = new Wallet(PRIVATE_KEY, zetaProvider);

const userAddress = walletOnZeta.address;

async function main() {
    // Connect to UToken contracts
    const UTokenContract = UToken__factory.connect(UTOKEN_ADDRESS, zetaProvider);

    const balance = await UTokenContract.balanceOf(userAddress);
    const decimals = await UTokenContract.decimals();
    console.log(`UToken balance for ${userAddress}: ${formatUnits(balance, decimals)}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
