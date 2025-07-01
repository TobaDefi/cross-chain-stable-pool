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
// const UTOKEN_ADDRESS = "0x773EEa2ce35E22202Efa1cFc1503Bc6E4CaE1eb6"; // old address
// const UTOKEN_ADDRESS = "0x832e435f1810ff47C79148279611AD3018BA9B66"; // old address
// const UTOKEN_ADDRESS = "0x344523007084B7B3ad3fb8581Dc7c815ff257DE0"; // old address
// const UTOKEN_ADDRESS = "0xEB480D393D982f75d3c851EC23A3a7D6cfa3d25c"; // old address
// const UTOKEN_ADDRESS = "0x988d8198CaD172C8a09b9c3675D88E911098D2B7"; // old address
// const UTOKEN_ADDRESS = "0xda4B5afCe92D914D159728C2Ed42f2e0DF741fb3"; // old address
// const UTOKEN_ADDRESS = "0x9f81ee28f1D550C548C9f8F4c3fE8dd92f57931b"; // old address
const UTOKEN_ADDRESS = "0x1902ff7f61aa1d4E4c3e90c472A3b838F54ca10d";

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
