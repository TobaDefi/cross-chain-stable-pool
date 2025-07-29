import * as dotenv from "dotenv";
dotenv.config();

import { BigNumber, ethers, Wallet } from "ethers";
const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;

import { UniversalTokenSale__factory, UToken__factory } from "../../typechain-types";
import { GatewayEVM, GatewayEVM__factory, ZRC20, ZRC20__factory } from "../../test/helpers/types/contracts";

const PRIVATE_KEY: string = process.env.MAINNET_KEYS || "";

// Mainnet URLs
// const MAINNET_ZETA_URL = "https://zetachain-evm.blockpi.network/v1/rpc/public";

// Testnet URLs
const TESTNET_ZETA_URL = "https://zetachain-athens.g.allthatnode.com/archive/evm";
const TESTNET_BSC_URL = "https://bsc-testnet-rpc.publicnode.com";
const TESTNET_ETH_URL = "https://ethereum-sepolia-rpc.publicnode.com";

const URLs: { [key: string]: string } = {
    ZETA: TESTNET_ZETA_URL,
    BSC: TESTNET_BSC_URL,
    ETH: TESTNET_ETH_URL,
};

const nativeTokenSymbols: { [key: string]: string } = {
    ZETA: "ZETA",
    BSC: "BNB",
    ETH: "ETH",
};

// All Gateway addresses from testnet
const GATEWAY_ZETA_ADDRESS = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
const GATEWAY_BSC_ADDRESS = "0x0c487a766110c85d301d96e33579c5b317fa4995";
const GATEWAY_ETH_ADDRESS = "0x0c487a766110c85d301d96e33579c5b317fa4995";

const GATEWAY_ADDRESSES: { [key: string]: string } = {
    ZETA: GATEWAY_ZETA_ADDRESS,
    BSC: GATEWAY_BSC_ADDRESS,
    ETH: GATEWAY_ETH_ADDRESS,
};

// ZRC-20 USDC addresses on ZetaChain
const ZRC20_ETH_USDC_ADDRESS = "0xcC683A782f4B30c138787CB5576a86AF66fdc31d";
const ZRC20_BSC_USDC_ADDRESS = "0x7c8dDa80bbBE1254a7aACf3219EBe1481c6E01d7";

const ZRC20_USDC_ADDRESSES: { [key: string]: string } = {
    BSC: ZRC20_BSC_USDC_ADDRESS,
    ETH: ZRC20_ETH_USDC_ADDRESS,
};

// Zetachain testnet UniversalTokenSale contract address
// const TOKEN_SALE_ADDRESS = "0xab185b643FF5e46eF0699bdD0AbF33Bf2552B216"; // old address
// const TOKEN_SALE_ADDRESS = "0x5f73BDCf848D7d73750DF1643E0104ce184AC142"; // old address
// const TOKEN_SALE_ADDRESS = "0xb98462f09ADDd2946BE1138B4079D995bd229782"; // old address
// const TOKEN_SALE_ADDRESS = "0x9Aa72e1d4Bd713863b4a5e2f397aa8eD70b7c1C1"; // old address
// const TOKEN_SALE_ADDRESS = "0xbc0eF5E01bD68b239445cAD15A3Dd6824969138a"; // old address
// const TOKEN_SALE_ADDRESS = "0x2b36a96c9E7177A4536C1cB9A50Fbc9f8D9A77E2"; // old address
// const TOKEN_SALE_ADDRESS = "0x65499569f3fFF05F3cA0e187FFcE663D35e7A28a"; // old address
// const TOKEN_SALE_ADDRESS = "0x55E0E7A3Bae318979885C9C38b15F68280c403b6"; // old address
// const TOKEN_SALE_ADDRESS = "0xD208D51a4e199fC6553926C03f3E155C30d18784"; // old address
const TOKEN_SALE_ADDRESS = "0xbE8b5d82DDE00677cCdb9dc22071CF635d459223";

// ZRC20 on ZetaChain for Native Tokens
const ZRC20_BNB_ADDRESS = "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891";
const ZRC20_ETH_ADDRESS = "0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0";


const ZRC20_ADDRESSES: { [key: string]: string } = {
    BSC: ZRC20_BNB_ADDRESS,
    ETH: ZRC20_ETH_ADDRESS,
};

// Connect to networks
const ethProvider = new ethers.providers.JsonRpcProvider(TESTNET_ETH_URL);
const bscProvider = new ethers.providers.JsonRpcProvider(TESTNET_BSC_URL);
const zetaProvider = new ethers.providers.JsonRpcProvider(TESTNET_ZETA_URL);

const providers: { [key: string]: ethers.providers.JsonRpcProvider } = {
    ZETA: zetaProvider,
    BSC: bscProvider,
    ETH: ethProvider,
};
// Create a wallet instance using the private key
const walletOnBsc = new Wallet(PRIVATE_KEY, bscProvider);
const walletOnEth = new Wallet(PRIVATE_KEY, ethProvider);
const walletOnZeta = new Wallet(PRIVATE_KEY, zetaProvider);

const wallets: { [key: string]: Wallet } = {
    ZETA: walletOnZeta,
    BSC: walletOnBsc,
    ETH: walletOnEth,
};

const externalNetwork = "BSC"; // Can be "BSC", or "ETH"

// All wallets to connect by one private key
const userAddress = wallets["ZETA"].address;

async function main() {
    console.log(`User address: ${userAddress}\n`);

    // Connect to ZRC20 native token contracts
    const zrc20EthContract = ZRC20__factory.connect(ZRC20_ETH_ADDRESS, zetaProvider);
    const zrc20BnbContract = ZRC20__factory.connect(ZRC20_BNB_ADDRESS, zetaProvider);

    const ZRC20_GAS_CONTRACTS: { [key: string]: ZRC20 } = {
        ETH: zrc20EthContract,
        BSC: zrc20BnbContract,
    };

    // Connect to ZRC20 USDC contracts
    const zrc20EthUsdcContract = ZRC20__factory.connect(ZRC20_ETH_USDC_ADDRESS, zetaProvider);
    const zrc20BnbUsdcContract = ZRC20__factory.connect(ZRC20_BSC_USDC_ADDRESS, zetaProvider);

    const ZRC20_USDC_CONTRACTS: { [key: string]: ZRC20 } = {
        ETH: zrc20EthUsdcContract,
        BSC: zrc20BnbUsdcContract,
    };

    // Connect to the UniversalTokenSale contract
    const tokenSaleContract = UniversalTokenSale__factory.connect(TOKEN_SALE_ADDRESS, zetaProvider);

    const WZetaAddress = await tokenSaleContract.WZeta();
    const WZetaContract = ZRC20__factory.connect(WZetaAddress, zetaProvider);
    const WZetaSymbol = await WZetaContract.symbol();
    const WZetaDecimals = await WZetaContract.decimals();

    const ZNativeSymbol = await ZRC20_GAS_CONTRACTS[externalNetwork].symbol();
    const ZNativeDecimals = await ZRC20_GAS_CONTRACTS[externalNetwork].decimals();

    // Set the chosen token for the sweep
    // const currentTokenContract = ZRC20_USDC_CONTRACTS[externalNetwork];
    const currentTokenContract = WZetaContract;
    const tokenSymbol = await currentTokenContract.symbol();
    const tokenDecimals = await currentTokenContract.decimals();

    // Check user's token balance before the sweep
    const userTokenBalanceBefore = await currentTokenContract.balanceOf(userAddress);
    console.log(`User token balance before sweep:  ${formatUnits(userTokenBalanceBefore, tokenDecimals)} ${tokenSymbol}`);
    // Check contract token balance before the sweep
    const contractTSBalanceBefore = await currentTokenContract.balanceOf(TOKEN_SALE_ADDRESS);
    console.log(`UniversalTokenSale contract token balance before sweep: ${formatUnits(contractTSBalanceBefore, tokenDecimals)} ${tokenSymbol}`);


    // Sweep all tokens from the UniversalTokenSale contract to the user address
    const tx = await tokenSaleContract.connect(walletOnZeta).sweepAll(
        userAddress,
        currentTokenContract.address
    );

    await tx.wait();
    // Use the transaction hash to get the cross-chain transaction (CCTX) data
    // You can use the hardhat task `npx hardhat cctx-data --hash <tx.hash>` or watched how to get CCTX data in the file `getCctxData.ts`
    console.log(`\n✅ Transaction hash: ${tx.hash}\n`);

    // Check user's token balance after the sweep
    const userTokenBalanceAfter = await currentTokenContract.balanceOf(userAddress);
    console.log(`User token balance after sweep:  ${formatUnits(userTokenBalanceAfter, tokenDecimals)} ${tokenSymbol}`);
    // Check contract token balance after the sweep
    const contractTSBalanceAfter = await currentTokenContract.balanceOf(TOKEN_SALE_ADDRESS);
    console.log(`UniversalTokenSale contract token balance after sweep: ${formatUnits(contractTSBalanceAfter, tokenDecimals)} ${tokenSymbol}`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
