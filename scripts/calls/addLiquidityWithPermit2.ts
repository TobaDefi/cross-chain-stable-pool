import * as dotenv from "dotenv";
dotenv.config();

import { BigNumber, ethers, Wallet } from "ethers";
const { parseEther, parseUnits, formatEther, formatUnits, solidityPack } = ethers.utils;
const { Zero, AddressZero, HashZero } = ethers.constants;

import {
    Vault,
    Vault__factory,
    VaultExtension,
    VaultExtension__factory,
    TestToken,
    TestToken__factory,
    CompositeLiquidityRouter,
    CompositeLiquidityRouter__factory,
    RouterCommon,
    RouterCommon__factory
} from "../../typechain-types";

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
    "0x03ffc595dB8d1f3558E94F6D1596F89695242643", // sorting by size (index 0)
    "0x8113553820dAa1F852D32C3f7D97461f09012043", // sorting by size (index 1)
    "0xD509688a2D8AAed688aEFfF6dd27bE97Eb10bD8D" // sorting by size (index 2)
];

const VAULT_ADDRESS = "0x1C8df36391afBe880Ed566486f95F37D84c0CAd1";
const VAULT_EXTENSION_ADDRESS = "0x9ada9586e3aaaB7C8F57a39180db44749c90301A";
const POOL_ADDRESS = "0x19288FB03a9ED741568eDF0898910CbCa1C7Ed86";
const COMPOSITE_LIQUIDITY_ROUTER_ADDRESS = "0x2c052031eC46Bc6f1Fa79c52Ad3B5F59A5BFBA17";
const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

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

// Wallets to connect by one private key
const userWallet = wallets[currentNetwork];

async function main() {
    console.log(`User address: ${userWallet.address}\n`);

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
    const compositeLiquidityRouterContract = CompositeLiquidityRouter__factory.connect(
        COMPOSITE_LIQUIDITY_ROUTER_ADDRESS,
        wallets[currentNetwork]
    ) as CompositeLiquidityRouter;

    // Create the interface for the addLiquidityUnbalanced function and encode the calldata
    const iface = new ethers.utils.Interface([
        "function addLiquidityUnbalancedToERC4626Pool(address,bool[],uint256[],uint256,bool,bytes) payable returns (uint256)"
    ]);
    const pool = POOL_ADDRESS;
    const wrapUnderlying = [false, false, false]; // Wrap first token, do not wrap second and third
    const exactAmountsIn = [parseUnits("1000", 18), parseUnits("1000", 18), parseUnits("1000", 18)];
    const minBptAmountOut = "0";
    const wethIsEth = false;
    const userData = "0x";

    const calldata = iface.encodeFunctionData("addLiquidityUnbalancedToERC4626Pool", [
        pool,
        wrapUnderlying,
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

    const permit2Batch = {
        details: [
            {
                token: TOKEN_ADDRESSES_SORTED[0],
                amount: exactAmountsIn[0],
                expiration: Math.floor(Date.now() / 1000) + 3600,
                nonce: 0
            },
            {
                token: TOKEN_ADDRESSES_SORTED[1],
                amount: exactAmountsIn[1],
                expiration: Math.floor(Date.now() / 1000) + 3600,
                nonce: 0
            },
            {
                token: TOKEN_ADDRESSES_SORTED[2],
                amount: exactAmountsIn[2],
                expiration: Math.floor(Date.now() / 1000) + 3600,
                nonce: 0
            }
        ],
        spender: COMPOSITE_LIQUIDITY_ROUTER_ADDRESS,
        sigDeadline: Math.floor(Date.now() / 1000) + 3600
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

    const permit2Signature = await userWallet._signTypedData(domain2, types2, permit2Batch);

    // Create the add liquidity transaction
    const addLiquidityTx = await compositeLiquidityRouterContract.permitBatchAndCall(
        permitBatch,
        permitSignatures,
        permit2Batch,
        permit2Signature,
        multicallData,
        { gasLimit: 5000000 }
    );

    await addLiquidityTx.wait();
    console.log(`\n✅ Add liquidity transaction hash: ${addLiquidityTx.hash}\n`);

    // // Check unlock status of the Vault
    // const isVaultUnlocked = await vaultExtensionContract.isUnlocked();
    // console.log(`\nIs Vault unlocked: ${isVaultUnlocked}\n`);
    // // If the Vault is not unlocked, you need to unlock it first
    // if (!isVaultUnlocked) {
    //     const data = vaultContract.interface.encodeFunctionData("addLiquidity", [addLiquidityParams]);

    //     const _vaultContract = Vault__factory.connect(VAULT_EXTENSION_ADDRESS, wallets[currentNetwork]) as Vault;

    //     const unlockTx = await _vaultContract.unlock(data, { gasLimit: 5000000 });
    //     // const unlockTx = await vaultContract.unlock(data, {gasLimit: 5000000});
    //     await unlockTx.wait();
    //     console.log(`\n✅ Vault unlocked! Transaction hash: ${unlockTx.hash}\n`);
    // }

    // // Connect to the TestToken contract
    // const testTokenContract = TestToken__factory.connect(
    //     TOKEN_ADDRESSES_SORTED[0],
    //     wallets[currentNetwork]
    // ) as TestToken;

    // // Check balance of the user before the add liquidity operation
    // const userBalanceBefore = await testTokenContract.balanceOf(userAddress);
    // console.log(
    //     `User balance before add liquidity: ${formatUnits(
    //         userBalanceBefore,
    //         await testTokenContract.decimals()
    //     )} ${await testTokenContract.symbol()}`
    // );

    // Add liquidity operation
    // const tx = await vaultContract.addLiquidity(addLiquidityParams, { gasLimit: 5000000 });
    // await tx.wait();
    // // Use the transaction hash to get the cross-chain transaction (CCTX) data
    // // You can use the hardhat task `npx hardhat cctx-data --hash <tx.hash>` or watched how to get CCTX data in the file `getCctxData.ts`
    // console.log(`\n✅ Transaction hash: ${tx.hash}\n`);

    // // Check balance of the user after the add liquidity operation
    // const userBalanceAfter = await testTokenContract.balanceOf(userAddress);
    // console.log(
    //     `User balance after add liquidity: ${formatUnits(
    //         userBalanceAfter,
    //         await testTokenContract.decimals()
    //     )} ${await testTokenContract.symbol()}`
    // );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
