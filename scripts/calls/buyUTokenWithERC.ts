import * as dotenv from "dotenv";
dotenv.config();

import { BigNumber, ethers, Wallet } from "ethers";
const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;


import { UniversalTokenSale__factory, UToken__factory } from "../../typechain-types";
import { GatewayEVM, GatewayEVM__factory, ZRC20__factory } from "../../test/helpers/types/contracts";


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

// Zetachain testnet UniversalTokenSale contract address
// const TOKEN_SALE_ADDRESS = "0xab185b643FF5e46eF0699bdD0AbF33Bf2552B216"; // old address
// const TOKEN_SALE_ADDRESS = "0x5f73BDCf848D7d73750DF1643E0104ce184AC142"; // old address
// const TOKEN_SALE_ADDRESS = "0xb98462f09ADDd2946BE1138B4079D995bd229782"; // old address
// const TOKEN_SALE_ADDRESS = "0x914d061Ec7A9aE41b00b7d499972E48eB9013883"; // old address
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

// ERC-20 on Ethereum for USDC
const ETH_USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

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

const currentNetwork = "ETH"; // Can be "BSC", or "ETH"

// All wallets to connect by one private key
const userAddress = wallets[currentNetwork].address;

async function main() {
    console.log(`User address: ${userAddress}\n`);

    // Connect to ZRC20 contracts
    const zrc20EthContract = ZRC20__factory.connect(ZRC20_ETH_ADDRESS, zetaProvider);
    const zrc20BnbContract = ZRC20__factory.connect(ZRC20_BNB_ADDRESS, zetaProvider);

    const ethUsdcContract = ZRC20__factory.connect(ETH_USDC_ADDRESS, ethProvider);
    const usdcSymbol = await ethUsdcContract.symbol();
    const usdcDecimal = await ethUsdcContract.decimals();

    // Connect to the UniversalTokenSale contract
    const tokenSaleContract = UniversalTokenSale__factory.connect(TOKEN_SALE_ADDRESS, zetaProvider);
    // Connect to the Gateway contracts for BSC
    const gatewayBscContract = GatewayEVM__factory.connect(GATEWAY_BSC_ADDRESS, bscProvider);
    // Connect to the Gateway contracts for Ethereum
    const gatewayEthContract = GatewayEVM__factory.connect(GATEWAY_ETH_ADDRESS, ethProvider);

    const gatewayEvmContracts: { [key: string]: GatewayEVM } = {
        BSC: gatewayBscContract,
        ETH: gatewayEthContract,
    };

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

    const depositAmount = parseUnits("5", usdcDecimal); // Amount of USDC to deposit

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

    // Check user balance of USDC on Ethereum before the deposit
    const userBalanceBefore = await ethUsdcContract.balanceOf(userAddress);
    console.log(`User balance before deposit: ${formatUnits(userBalanceBefore, usdcDecimal)} ${usdcSymbol}`);

    // Approve the USDC on Ethereum to the Gateway contract
    const approveTx = await ethUsdcContract.connect(wallets[currentNetwork]).approve(
        GATEWAY_ADDRESSES[currentNetwork],
        depositAmount
    );
    await approveTx.wait();
    console.log(`\n✅ Transaction approval hash: ${approveTx.hash}\n`);

    // Deposit and call the UniversalTokenSale contract on ZetaChain
    const tx = await gatewayEvmContracts[currentNetwork].connect(wallets[currentNetwork])["depositAndCall(address,uint256,address,bytes,(address,bool,address,bytes,uint256))"](
        TOKEN_SALE_ADDRESS,
        depositAmount,
        ETH_USDC_ADDRESS,
        message,
        revertOptions
    );

    await tx.wait();
    // Use the transaction hash to get the cross-chain transaction (CCTX) data
    // You can use the hardhat task `npx hardhat cctx-data --hash <tx.hash>` or watched how to get CCTX data in the file `getCctxData.ts`
    console.log(`\n✅ Transaction hash: ${tx.hash}\n`);

    // Check user balance of USDC on Ethereum after the deposit
    const userBalanceAfter = await ethUsdcContract.balanceOf(userAddress);
    console.log(`User balance after deposit: ${formatUnits(userBalanceAfter, usdcDecimal)} ${usdcSymbol}`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
