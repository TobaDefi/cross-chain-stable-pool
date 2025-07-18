import * as dotenv from "dotenv";
dotenv.config();

import { BigNumber, ethers, Wallet } from "ethers";
const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;

import {
    Router,
    Router__factory
} from "../../typechain-types";
import { MaxUint256 } from "@uniswap/permit2-sdk";

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
    ETH: TESTNET_ETH_URL
};

const nativeTokenSymbols: { [key: string]: string } = {
    ZETA: "ZETA",
    BSC: "BNB",
    ETH: "ETH"
};

const TOKEN_ADDRESSES = [
    "0x03ffc595dB8d1f3558E94F6D1596F89695242643", // sorting by size
    "0x8113553820dAa1F852D32C3f7D97461f09012043", // sorting by size
    "0xD509688a2D8AAed688aEFfF6dd27bE97Eb10bD8D", // sorting by size
    "0xe69789eEA4DC1C87596d9ADa181B57C4141C89d6" // NO sorting by size (new token for testing)
];

// const VAULT_ADDRESS = "0x1C8df36391afBe880Ed566486f95F37D84c0CAd1";
const VAULT_TEST_ADDRESS = "0xd48F8CF9198a969e6b730525862C2F2B0d8aD27B";
// const VAULT_ADDRESS = "0xba1333333333a1ba1108e8412f11850a5c319ba9"; // from UI
// const ROUTER_ADDRESS = "0xd6291099944E73DFcb694114687bC56e04db68A3";
// const ROUTER_ADDRESS = "0x5e315f96389c1aaf9324d97d3512ae1e0bf3c21a"; // from UI
// const ROUTER_ADDRESS = "0xfF518a7211C9fC44D450858d301a570935F73BBd";
const ROUTER_TEST_ADDRESS = "0x46f15e4B3bBDa3C749b1A422bc6e20663d7e10B0";
// const STABLE_POOL_ADDRESS = "0x19288FB03a9ED741568eDF0898910CbCa1C7Ed86";
const STABLE_TEST_POOL_ADDRESS = "0xd75e75A2e83713497C0116227081B47493f26Ef9";
// const STABLE_POOL_ADDRESS = "0x1aef650c3236619ed4ee448f8c6563fed1c6537f"; // from UI

// Connect to networks
const ethProvider = new ethers.providers.JsonRpcProvider(TESTNET_ETH_URL);
const bscProvider = new ethers.providers.JsonRpcProvider(TESTNET_BSC_URL);
const zetaProvider = new ethers.providers.JsonRpcProvider(TESTNET_ZETA_URL);

const providers: { [key: string]: ethers.providers.JsonRpcProvider } = {
    ZETA: zetaProvider,
    BSC: bscProvider,
    ETH: ethProvider
};
// Create a wallet instance using the private key
const walletOnBsc = new Wallet(PRIVATE_KEY, bscProvider);
const walletOnEth = new Wallet(PRIVATE_KEY, ethProvider);
const walletOnZeta = new Wallet(PRIVATE_KEY, zetaProvider);

const wallets: { [key: string]: Wallet } = {
    ZETA: walletOnZeta,
    BSC: walletOnBsc,
    ETH: walletOnEth
};

const currentNetwork = "ETH"; // Can be "BSC", or "ETH"

// All wallets to connect by one private key
const userAddress = wallets[currentNetwork].address;
const user = wallets[currentNetwork];

async function main() {
    console.log(`User address: ${userAddress}\n`);

    /**
     @notice Data for an add liquidity operation.
     @param pool Address of the pool
     @param to Address of user to mint to
     @param maxAmountsIn Maximum amounts of input tokens
     @param minBptAmountOut Minimum amount of output pool tokens
     @param kind Add liquidity kind
     @param userData Optional user data

    struct AddLiquidityParams {
        address pool;
        address to;
        uint256[] maxAmountsIn;
        uint256 minBptAmountOut;
        AddLiquidityKind kind;
        bytes userData;
    }
    */

    enum AddLiquidityKind {
        PROPORTIONAL,
        UNBALANCED,
        SINGLE_TOKEN_EXACT_OUT,
        DONATION,
        CUSTOM
    }

    // Connect to the CompositeLiquidityRouter contract
    const routerContract = Router__factory.connect(ROUTER_TEST_ADDRESS, wallets[currentNetwork]) as Router;

    const depositAmount = parseUnits("500", 18);

    // Approve tokens for the router
    // for (const tokenAddress of TOKEN_ADDRESSES) {
    //     const tokenContract = TestToken__factory.connect(tokenAddress, wallets[currentNetwork]) as TestToken;
    //     const approvalTx = await tokenContract.approve(ROUTER_TEST_ADDRESS, MaxUint256);
    //     await approvalTx.wait();
    //     console.log(`Approved ${tokenAddress} tokens for the router.`);
    // }

    // Create the add liquidity transaction: proportional
    const addLiquidityProportionalTx = await routerContract.addLiquidityProportional(
        STABLE_TEST_POOL_ADDRESS,
        TOKEN_ADDRESSES.map(() => depositAmount),
        parseUnits("10", 18), // exact Bpt AmountOut
        false, // weth is eth
        "0x", // no additional user data
        { gasLimit: 5000000 }
    );

    await addLiquidityProportionalTx.wait();
    console.log(`\n✅ Add proportional liquidity transaction hash: ${addLiquidityProportionalTx.hash}\n`);

    // Create the add liquidity transaction: unbalanced
    const depositAmounts = [0, depositAmount, 0];
    const addLiquidityUnbalancedTx = await routerContract.addLiquidityUnbalanced(
        STABLE_TEST_POOL_ADDRESS,
        depositAmounts,
        parseUnits("10", 18), // exact Bpt AmountOut
        false, // weth is eth
        "0x", // No additional user data
        { gasLimit: 5000000 }
    );

    await addLiquidityUnbalancedTx.wait();
    console.log(`\n✅ Add unbalanced liquidity transaction hash: ${addLiquidityUnbalancedTx.hash}\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
