import * as dotenv from "dotenv";
dotenv.config();

import { BigNumber, ethers, Wallet } from "ethers";
const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;
import { SignatureTransfer, PERMIT2_ADDRESS } from "@uniswap/permit2-sdk";

import {
    Vault,
    Vault__factory,
    VaultExtension,
    VaultExtension__factory,
    TestToken,
    TestToken__factory,
    Router,
    Router__factory
} from "../../typechain-types";
import { MaxUint256 } from "../../test/helpers";

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

const TOKEN_ADDRESSES_SORTED = [
    "0x03ffc595dB8d1f3558E94F6D1596F89695242643",
    "0x8113553820dAa1F852D32C3f7D97461f09012043",
    "0xD509688a2D8AAed688aEFfF6dd27bE97Eb10bD8D"
];

const VAULT_ADDRESS = "0x1C8df36391afBe880Ed566486f95F37D84c0CAd1";
const VAULT_EXTENSION_ADDRESS = "0x9ada9586e3aaaB7C8F57a39180db44749c90301A";
const STABLE_POOL_ADDRESS = "0x19288FB03a9ED741568eDF0898910CbCa1C7Ed86";
// const COMPOSITE_LIQUIDITY_ROUTER_ADDRESS = "0x2c052031eC46Bc6f1Fa79c52Ad3B5F59A5BFBA17";
const ROUTER_ADDRESS = "0xd6291099944E73DFcb694114687bC56e04db68A3";
// const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

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

    // Connect to the Vault contract
    const vaultContract = Vault__factory.connect(VAULT_ADDRESS, wallets[currentNetwork]) as Vault;

    // Connect to the VaultExtension contract
    const vaultExtensionContract = VaultExtension__factory.connect(
        VAULT_ADDRESS,
        wallets[currentNetwork]
    ) as VaultExtension;

    // Connect to the Router contract
    const routerContract = Router__factory.connect(ROUTER_ADDRESS, wallets[currentNetwork]) as Router;

    // Create the interface for the addLiquidityUnbalanced function and encode the calldata
    const iface = new ethers.utils.Interface([
        "function initialize(address,address[],uint256[],uint256,bool,bytes) payable returns (uint256)"
    ]);
    const pool = STABLE_POOL_ADDRESS;
    const tokens = TOKEN_ADDRESSES_SORTED;
    const exactAmountsIn = [parseUnits("1000", 18), parseUnits("1000", 18), parseUnits("1000", 18)];
    const minBptAmountOut = "0";
    const wethIsEth = false;
    const userData = "0x";

    const calldata = iface.encodeFunctionData("initialize", [
        pool,
        tokens,
        exactAmountsIn,
        minBptAmountOut,
        wethIsEth,
        userData
    ]);

    const multicallData = [calldata];

    type PermitApproval = {
        token: string;
        owner: string;
        spender: string;
        amount: number;
        nonce: number;
        deadline: number;
    };
    const permitBatch: PermitApproval[] = [];
    const permitSignatures: string[] = [];

    const currentTimestamp = await providers[currentNetwork].getBlock("latest").then((block) => block.timestamp);

    const permit2Batch = {
        details: [
            {
                token: TOKEN_ADDRESSES_SORTED[0],
                amount: exactAmountsIn[0],
                expiration: currentTimestamp + 36000,
                nonce: 1
            },
            {
                token: TOKEN_ADDRESSES_SORTED[1],
                amount: exactAmountsIn[1],
                expiration: currentTimestamp + 36000,
                nonce: 1
            },
            {
                token: TOKEN_ADDRESSES_SORTED[2],
                amount: exactAmountsIn[2],
                expiration: currentTimestamp + 36000,
                nonce: 1
            }
        ],
        spender: ROUTER_ADDRESS,
        sigDeadline: currentTimestamp + 36000
    };

    const domain2 = {
        name: "Permit2",
        chainId: 11155111,
        verifyingContract: PERMIT2_ADDRESS
    };

    const types2 = {
        PermitBatch: [
            { name: "details", type: "PermitDetails[]" },
            { name: "spender", type: "address" },
            { name: "sigDeadline", type: "uint256" }
        ],
        PermitDetails: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint160" },
            { name: "expiration", type: "uint48" },
            { name: "nonce", type: "uint48" }
        ]
    };

    const permit2Signature = await user._signTypedData(domain2, types2, permit2Batch);

    // Approve tokens for the router
    for (const tokenAddress of TOKEN_ADDRESSES_SORTED) {
        const tokenContract = TestToken__factory.connect(tokenAddress, wallets[currentNetwork]) as TestToken;
        const approvalTx = await tokenContract.approve(PERMIT2_ADDRESS, MaxUint256);
        await approvalTx.wait();
        console.log(`Approved ${tokenContract.address} tokens for the Permit2 contract.`);
    }

    // Create the add liquidity transaction
    const addLiquidityTx = await routerContract.permitBatchAndCall(
        permitBatch,
        permitSignatures,
        permit2Batch,
        permit2Signature,
        multicallData,
        { gasLimit: 5000000 }
    );

    await addLiquidityTx.wait();
    console.log(`\n✅ Add liquidity transaction hash: ${addLiquidityTx.hash}\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
