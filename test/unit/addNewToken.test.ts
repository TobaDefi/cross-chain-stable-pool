import {
    loadFixture,
    ethers,
    expect,
    parseEther,
    parseUnits,
    formatUnits,
    Zero,
    AddressZero,
    BigNumber,
    MaxUint256,
    logger,
    HashZero,
    SignerWithAddress,
    time
} from "../helpers"; // Adjust the path as needed

import {
    VaultAdmin,
    VaultAdmin__factory,
    VaultExtension,
    VaultExtension__factory,
    ProtocolFeeController,
    ProtocolFeeController__factory,
    Vault,
    Vault__factory,
    StablePool,
    StablePool__factory,
    Router,
    Router__factory,
    TestToken,
    TestToken__factory,
    ERC20__factory,
    ReentrancyGuardTransient__factory,
    IProtocolFeeController__factory,
    Math__factory,
    IVaultMain__factory
} from "../../typechain-types";
import * as typechainTypes from "../../typechain-types";
import { all } from "axios";

enum TOKEN_TYPE {
    STANDARD = 0,
    WITH_RATE = 1
}

const PAUSE_WINDOW_DURATION = time.duration.days(90); // 90 days in seconds
const BUFFER_PERIOD_DURATION = time.duration.days(30); // 30 days in seconds
const MINIMUM_TRADE_AMOUNT = 1e6;
const MINIMUM_WRAP_AMOUNT = 1e3;
const DEFAULT_AMP_FACTOR = 200;
const SWAP_FEE_PERCENTAGE = 1000000000000;

// Helper function to approve token
async function approveToken(token: TestToken | string, owner: SignerWithAddress, spender: string, amount: BigNumber) {
    const tokenContract = typeof token === "string" ? TestToken__factory.connect(token, owner) : token;
    const approvalTx = await tokenContract.connect(owner).approve(spender, amount);
    await approvalTx.wait();
    const allowance = await tokenContract.allowance(owner.address, spender);
    expect(allowance).to.be.equal(amount);
}
// Helper function to batch approve tokens
async function batchApproveTokens(
    tokens: TestToken[] | string[],
    owner: SignerWithAddress,
    spender: string,
    amount: BigNumber
) {
    for (const token of tokens) {
        await approveToken(token, owner, spender, amount);
    }
}
// Helper function to allocate token
async function allocateTokenTo(token: TestToken | string, recipient: SignerWithAddress, amount: BigNumber) {
    const tokenContract = typeof token === "string" ? TestToken__factory.connect(token, recipient) : token;
    const balanceBefore = await tokenContract.balanceOf(recipient.address);
    const mintTx = await tokenContract.connect(recipient).mint(amount);
    await mintTx.wait();
    const balanceAfter = await tokenContract.balanceOf(recipient.address);
    expect(balanceAfter.sub(balanceBefore)).to.be.equal(amount);
}

// Helper function to batch allocate tokens
async function batchAllocateTokensTo(tokens: TestToken[] | string[], recipient: SignerWithAddress, amount: BigNumber) {
    for (const token of tokens) {
        await allocateTokenTo(token, recipient, amount);
    }
}

async function preSetupTestEnvironment() {
    const [deployer, user] = await ethers.getSigners();

    const numTokens = 3;
    const tokenFactory = new TestToken__factory(deployer);
    const initializeTokens = [];
    // Deploy multiple tokens
    for (let i = 0; i < numTokens; i++) {
        const tokenName = `Test Token ${i + 1}`;
        const tokenSymbol = `TT${i + 1}`;
        const contract = await tokenFactory.deploy(tokenName, tokenSymbol);
        await contract.deployed();

        initializeTokens.push(contract);
    }

    const sortedTokenAddresses = initializeTokens
        .map((token) => token.address)
        .sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });

    const newToken = await tokenFactory.deploy("Test Token 4", "TT4");
    await newToken.deployed();

    const futureVaultAddress = ethers.Contract.getContractAddress({
        from: deployer.address,
        nonce: (await deployer.getTransactionCount()) + 3 // VaultAdmin, VaultExtension, ProtocolFeeController, Vault
    });

    const vaultAdminContractFactory = new VaultAdmin__factory(deployer);
    const vaultAdminContract: VaultAdmin = await vaultAdminContractFactory.deploy(
        futureVaultAddress,
        PAUSE_WINDOW_DURATION,
        BUFFER_PERIOD_DURATION,
        MINIMUM_TRADE_AMOUNT,
        MINIMUM_WRAP_AMOUNT
    );
    await vaultAdminContract.deployed();

    const vaultExtensionFactory = new VaultExtension__factory(deployer);
    const vaultProxyContract: VaultExtension = await vaultExtensionFactory.deploy(
        futureVaultAddress,
        vaultAdminContract.address
    );
    await vaultProxyContract.deployed();

    const protocolFeeControllerFactory = new ProtocolFeeController__factory(deployer);
    const protocolFeeControllerContract: ProtocolFeeController = await protocolFeeControllerFactory.deploy(
        futureVaultAddress,
        Zero, // protocol fee percentage
        Zero // protocol fee collector
    );
    await protocolFeeControllerContract.deployed();

    const vaultFactory = new Vault__factory(deployer);
    const vaultContract: Vault = await vaultFactory.deploy(
        vaultProxyContract.address,
        vaultAdminContract.address,
        protocolFeeControllerContract.address
    );
    await vaultContract.deployed();

    const vaultExtensionContract: VaultExtension = VaultExtension__factory.connect(vaultContract.address, deployer);

    const stablePoolFactory = new StablePool__factory(deployer);
    const stablePoolContract: StablePool = await stablePoolFactory.deploy(
        {
            name: "Stable Pool",
            symbol: "STABLE",
            amplificationParameter: DEFAULT_AMP_FACTOR,
            version: "1.0.0"
        },
        vaultContract.address
    );
    await stablePoolContract.deployed();

    const routerFactory = new Router__factory(deployer);
    const routerContract: Router = await routerFactory.deploy(
        vaultContract.address,
        AddressZero, // WETH address
        '{"name":"Router""version":2"deployment":"2025-v3-router-v2"}'
    );
    await routerContract.deployed();

    // const tokensAddresses = [...sortedTokenAddresses, newToken.address];

    // const _sortedTokenAddresses = tokensAddresses
    //     .map((token) => token)
    //     .sort((a, b) => {
    //         return a.toLowerCase().localeCompare(b.toLowerCase());
    //     });

    const tokenConfigs = sortedTokenAddresses.map((tokenAddress, index) => ({
        // const tokenConfigs = _sortedTokenAddresses.map((tokenAddress) => ({
        token: tokenAddress,
        chainId: index + 1, // Assuming chainId is just the index + 1 for simplicity
        tokenType: TOKEN_TYPE.STANDARD,
        rateProvider: AddressZero,
        paysYieldFees: false
    }));

    const roleAccounts = {
        pauseManager: deployer.address,
        swapFeeManager: deployer.address,
        poolCreator: deployer.address
    };
    const liquidityManagement = {
        disableUnbalancedLiquidity: false,
        enableAddLiquidityCustom: false,
        enableRemoveLiquidityCustom: false,
        enableDonation: false
    };

    await vaultExtensionContract.registerPool(
        stablePoolContract.address,
        tokenConfigs,
        SWAP_FEE_PERCENTAGE, // swapFeePercentage,
        Zero, // pauseWindowEndTime
        false, // protocolFeeExempt
        roleAccounts,
        AddressZero, // poolHooksContract
        liquidityManagement
    );

    return {
        deployer,
        user,
        vaultAdminContract,
        vaultExtensionContract,
        protocolFeeControllerContract,
        vaultContract,
        stablePoolContract,
        routerContract,
        initializeTokens,
        sortedTokenAddresses,
        newToken
    };
}

async function setupWithProportionalInit() {
    type PreSetupReturnType = Awaited<ReturnType<typeof preSetupTestEnvironment>>;
    const preSetup: PreSetupReturnType = await loadFixture(preSetupTestEnvironment);
    const { deployer, stablePoolContract, routerContract, vaultExtensionContract, sortedTokenAddresses } = preSetup;

    const initializeAmount = parseUnits("100", 18);
    const minBptAmountOut = parseUnits("50", 18);

    // Allocate tokens to the deployer
    await batchAllocateTokensTo(sortedTokenAddresses, deployer, initializeAmount);
    // Approve tokens for the router
    await batchApproveTokens(sortedTokenAddresses, deployer, routerContract.address, initializeAmount);
    // Initialize the stable pool with proportional liquidity
    const initializeTx = await routerContract.initialize(
        stablePoolContract.address,
        sortedTokenAddresses,
        sortedTokenAddresses.map(() => initializeAmount),
        minBptAmountOut,
        false, // weth is eth
        HashZero // No additional user data
    );
    await initializeTx.wait();

    expect(initializeTx).to.emit(vaultExtensionContract, "LiquidityAdded");

    return {
        ...preSetup
    };
}
async function setupWithUnbalancedInit() {
    type PreSetupReturnType = Awaited<ReturnType<typeof preSetupTestEnvironment>>;
    const preSetup: PreSetupReturnType = await loadFixture(preSetupTestEnvironment);
    const { deployer, stablePoolContract, routerContract, vaultExtensionContract, sortedTokenAddresses } = preSetup;

    const amount = parseUnits("100", 18);
    const initializeAmounts = sortedTokenAddresses.map((_, index) => amount.mul(index + 1));
    const minBptAmountOut = parseUnits("5", 18);

    // Allocate tokens to the deployer and approve them for the router
    sortedTokenAddresses.forEach(async (tokenAddress, index) => {
        await allocateTokenTo(tokenAddress, deployer, initializeAmounts[index]);
        await approveToken(tokenAddress, deployer, routerContract.address, initializeAmounts[index]);
    });
    // Initialize the stable pool with unbalanced liquidity
    const initializeTx = await routerContract.connect(deployer).initialize(
        stablePoolContract.address,
        sortedTokenAddresses,
        initializeAmounts,
        minBptAmountOut,
        false, // weth is eth
        HashZero // No additional user data
    );
    await initializeTx.wait();

    expect(initializeTx).to.emit(vaultExtensionContract, "LiquidityAdded");

    return {
        ...preSetup
    };
}

describe("# Initialize Stable Pool", function () {
    context.skip("* unbalanced init", async () => {
        it("Should initialize the stable pool with unbalanced tokens", async () => {
            const {
                user,
                stablePoolContract,
                routerContract,
                initializeTokens,
                sortedTokenAddresses,
                newToken,
                vaultContract
            } = await loadFixture(preSetupTestEnvironment);

            const tokensAddresses = [...sortedTokenAddresses, newToken.address];

            const _sortedTokenAddresses = tokensAddresses
                .map((token) => token)
                .sort((a, b) => {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });

            const amount = parseUnits("100", 18);
            // const initializeAmounts = sortedTokenAddresses.map((_, index) => amount.mul(index + 1));
            const initializeAmounts = _sortedTokenAddresses.map((_, index) =>
                index === _sortedTokenAddresses.length - 1 ? amount : amount.div(2)
            );
            const minBptAmountOut = parseUnits("5", 18);

            // sortedTokenAddresses.forEach(async (tokenAddress, index) => {
            _sortedTokenAddresses.forEach(async (tokenAddress, index) => {
                await allocateTokenTo(tokenAddress, user, initializeAmounts[index]);
                await approveToken(tokenAddress, user, routerContract.address, initializeAmounts[index]);
            });
            await batchApproveTokens(initializeTokens, user, routerContract.address, MaxUint256);

            // Initialize the stable pool with unbalanced tokens
            await routerContract.connect(user).initialize(
                stablePoolContract.address,
                // sortedTokenAddresses,
                _sortedTokenAddresses,
                initializeAmounts,
                minBptAmountOut,
                false, // weth is eth
                HashZero // No additional user data
            );
        });
    });
});

describe("# Add Liquidity", function () {
    context("* proportional", async () => {
        it("Should add liquidity to the stable pool", async () => {
            const { user, stablePoolContract, routerContract, initializeTokens, sortedTokenAddresses, vaultContract } =
                await loadFixture(setupWithProportionalInit);

            const minBptAmountOut = parseUnits("300", 18);
            const depositAmount = parseUnits("100", 18);
            // Allocate tokens to the user
            await batchAllocateTokensTo(initializeTokens, user, depositAmount);
            // Approve tokens for the router
            await batchApproveTokens(initializeTokens, user, routerContract.address, depositAmount);

            // const amountsIn = await routerContract.connect(user).callStatic.queryAddLiquidityProportional(
            //     stablePoolContract.address,
            //     exactBptAmountOut,
            //     user.address,
            //     HashZero // no additional user data
            // );
            // const maxAmountsIn = amountsIn;
            // console.table(maxAmountsIn);

            const maxAmountsIn = initializeTokens.map(() => depositAmount);
            // Create the add liquidity transaction: proportional
            const addLiquidityProportionalTx = await routerContract.connect(user).addLiquidityProportional(
                stablePoolContract.address,
                maxAmountsIn,
                minBptAmountOut,
                false, // weth is eth
                HashZero, // no additional user data
                { gasLimit: 5000000 }
            );

            await addLiquidityProportionalTx.wait();

            await expect(addLiquidityProportionalTx).to.emit(vaultContract, "LiquidityAdded");

            // Remove the liquidity

            // Create the remove liquidity transaction: proportional

            console.log("Router address:", routerContract.address);
            console.log("Stable Pool address:", stablePoolContract.address);
            console.log("Vault address:", vaultContract.address);
            console.log("User address:", user.address);

            const minAmountsOut = initializeTokens.map(() => parseUnits("10", 18));
            const exactBptAmountIn = parseUnits("50", 18); // Exact BPT amount to remove
            // await stablePoolContract.approve(
            //     routerContract.address,
            //     MaxUint256
            // ); // Approve the vault to spend stable pool tokens
            await approveToken(stablePoolContract.address, user, routerContract.address, MaxUint256); // Approve the vault to spend stable pool tokens

            const removeLiquidityProportionalTx = await routerContract.connect(user).removeLiquidityProportional(
                stablePoolContract.address,
                exactBptAmountIn,
                minAmountsOut,
                false, // weth is eth
                HashZero, // No additional user data
                { gasLimit: 5000000 }
            );

            await removeLiquidityProportionalTx.wait();
            await expect(removeLiquidityProportionalTx).to.emit(vaultContract, "LiquidityRemoved");
        });
    });

    context.skip("* twice unbalanced", async () => {
        it("Should twice add liquidity to the pool", async () => {
            const { user, stablePoolContract, routerContract, initializeTokens, sortedTokenAddresses, vaultContract } =
                await loadFixture(setupWithProportionalInit);

            // ---- First add liquidity unbalanced ----
            const minBptAmountOut = parseUnits("100", 18);
            const exactAmountIn = parseUnits("150", 18);
            // Allocate token to the user: first token from the sorted list
            await allocateTokenTo(initializeTokens[0], user, exactAmountIn);
            // Approve token for the router
            await approveToken(initializeTokens[0], user, routerContract.address, exactAmountIn);
            const exactAmountsIn = initializeTokens.map((_, index) => {
                return index === 0 ? exactAmountIn : Zero;
            });
            let addLiquidityUnbalancedTx = await routerContract.connect(user).addLiquidityUnbalanced(
                stablePoolContract.address,
                exactAmountsIn,
                minBptAmountOut,
                false, // weth is eth
                HashZero // no additional user data
            );
            await addLiquidityUnbalancedTx.wait();
            await expect(addLiquidityUnbalancedTx).to.emit(vaultContract, "LiquidityAdded");

            // 100086863678506
            // 67023009310935

            // ---- Second add liquidity unbalanced ----
            // const minBptAmountOut = parseUnits("100", 18);
            // const exactAmountIn = parseUnits("150", 18);
            // Allocate token to the user: first token from the sorted list
            await allocateTokenTo(initializeTokens[0], user, exactAmountIn);
            // Approve token for the router
            await approveToken(initializeTokens[0], user, routerContract.address, exactAmountIn);
            // const exactAmountsIn = initializeTokens.map((_, index) => {
            //     return index === 0 ? exactAmountIn : Zero;
            // });
            addLiquidityUnbalancedTx = await routerContract.connect(user).addLiquidityUnbalanced(
                stablePoolContract.address,
                exactAmountsIn,
                minBptAmountOut,
                false, // weth is eth
                HashZero // no additional user data
            );
            await addLiquidityUnbalancedTx.wait();
            await expect(addLiquidityUnbalancedTx).to.emit(vaultContract, "LiquidityAdded");
        });
    });

    context("* unbalanced and proportional", async () => {
        it("Should add liquidity of various types to the pool", async () => {
            const { user, stablePoolContract, routerContract, initializeTokens, sortedTokenAddresses, vaultContract } =
                await loadFixture(setupWithProportionalInit);

            // ---- Add liquidity unbalanced ----
            const minBptAmountOut = parseUnits("100", 18);
            const exactAmountIn = parseUnits("150", 18);
            // Allocate token to the user: first token from the sorted list
            await allocateTokenTo(initializeTokens[0], user, exactAmountIn);
            // Approve token for the router
            await approveToken(initializeTokens[0], user, routerContract.address, exactAmountIn);
            const exactAmountsIn = initializeTokens.map((_, index) => {
                return index === 0 ? exactAmountIn : Zero;
            });
            const addLiquidityUnbalancedTx = await routerContract.connect(user).addLiquidityUnbalanced(
                stablePoolContract.address,
                exactAmountsIn,
                minBptAmountOut,
                false, // weth is eth
                HashZero // no additional user data
            );
            await addLiquidityUnbalancedTx.wait();
            await expect(addLiquidityUnbalancedTx).to.emit(vaultContract, "LiquidityAdded");

            // ---- Add liquidity proportional ----
            const exactBptAmountOut = parseUnits("300", 18);
            const maxAmountIn = parseUnits("170", 18);
            // Allocate tokens to the user
            await batchAllocateTokensTo(initializeTokens, user, maxAmountIn);
            // Approve tokens for the router
            await batchApproveTokens(initializeTokens, user, routerContract.address, maxAmountIn);
            const maxAmountsIn = initializeTokens.map(() => maxAmountIn);
            // Create the add liquidity transaction: proportional
            const addLiquidityProportionalTx = await routerContract.connect(user).addLiquidityProportional(
                stablePoolContract.address,
                maxAmountsIn,
                exactBptAmountOut,
                false, // weth is eth
                HashZero // no additional user data
            );

            await addLiquidityProportionalTx.wait();
            await expect(addLiquidityProportionalTx).to.emit(vaultContract, "LiquidityAdded");
        });
    });

    context("* unbalanced", async () => {
        it("Should add liquidity to the stable pool", async () => {
            const {
                user,
                stablePoolContract,
                routerContract,
                initializeTokens,
                sortedTokenAddresses,
                newToken,
                vaultContract
            } = await loadFixture(setupWithProportionalInit);

            // const numberOTimes = 2; // Number of tokens to add liquidity for
            // for (let i = 0; i < numberOTimes; i++) {
            const exactBptAmountOut = parseUnits("10", 18);
            const depositAmount = parseUnits("100", 18);
            // Allocate tokens to the user
            await batchAllocateTokensTo(initializeTokens, user, depositAmount);
            // Approve tokens for the router
            await batchApproveTokens(initializeTokens, user, routerContract.address, depositAmount);

            const maxAmountsIn = initializeTokens.map((_, index) => {
                return index === 0 ? depositAmount : Zero;
            });
            // Create the add liquidity transaction: unbalanced
            const addLiquidityUnbalancedTx = await routerContract.connect(user).addLiquidityUnbalanced(
                stablePoolContract.address,
                maxAmountsIn,
                exactBptAmountOut,
                false, // weth is eth
                HashZero, // no additional user data
                { gasLimit: 5000000 }
            );

            await addLiquidityUnbalancedTx.wait();

            await expect(addLiquidityUnbalancedTx).to.emit(vaultContract, "LiquidityAdded");
            // }
        });
    });

    context("* Add New Token", async () => {
        it.only("Should add a new token to the vault", async () => {
            const { deployer, user, vaultContract, stablePoolContract, routerContract, initializeTokens, newToken } =
                await loadFixture(setupWithProportionalInit);

            const tokenConfig = {
                token: newToken.address,
                chainId: 1,
                tokenType: TOKEN_TYPE.STANDARD,
                rateProvider: AddressZero,
                paysYieldFees: false
            };

            const exactAmountIn = parseUnits("100", 18);
            // Allocate tokens to the user
            await batchAllocateTokensTo([newToken], deployer, exactAmountIn);
            // Approve tokens for the router
            await batchApproveTokens([newToken], deployer, routerContract.address, exactAmountIn);

            await expect(
                await routerContract
                    .connect(deployer)
                    .addTokenToPool(stablePoolContract.address, tokenConfig, exactAmountIn)
            ).to.emit(vaultContract, "AddedNewTokenToPool");
            // .withArgs(stablePoolContract.address, newToken.address, 3);
        });

        it.only("Should add a new token to the vault and add liquidity", async () => {
            const { deployer, user, vaultContract, stablePoolContract, routerContract, initializeTokens, newToken } =
                await loadFixture(setupWithProportionalInit);

            const tokenConfig = {
                token: newToken.address,
                chainId: 1,
                tokenType: TOKEN_TYPE.STANDARD,
                rateProvider: AddressZero,
                paysYieldFees: false
            };

            const initialAmount = parseUnits("150", 18);
            // Allocate tokens to the user
            await batchAllocateTokensTo([newToken], deployer, initialAmount);
            // Approve tokens for the router
            await batchApproveTokens([newToken], deployer, routerContract.address, initialAmount);

            await expect(
                await routerContract
                    .connect(deployer)
                    .addTokenToPool(stablePoolContract.address, tokenConfig, initialAmount)
            ).to.emit(vaultContract, "AddedNewTokenToPool");
            // .withArgs(stablePoolContract.address, newToken.address, 3);

            const tokens = [...initializeTokens, newToken];
            let minBptAmountOut = parseUnits("100", 18);
            let depositAmount = parseUnits("100", 18);
            let maxAmountsIn = tokens.map(() => depositAmount);
            // ------------------ Add liquidity: proportional ------------------

            // // Allocate tokens to the user
            // await batchAllocateTokensTo(tokens, user, depositAmount);
            // // Approve tokens for the router
            // await batchApproveTokens(tokens, user, routerContract.address, depositAmount);

            // // Create the add liquidity transaction: proportional
            // const addLiquidityProportionalTx = await routerContract.connect(user).addLiquidityProportional(
            //     stablePoolContract.address,
            //     maxAmountsIn,
            //     exactBptAmountOut,
            //     false, // weth is eth
            //     HashZero // no additional user data
            // );

            // await addLiquidityProportionalTx.wait();

            // await expect(addLiquidityProportionalTx).to.emit(vaultContract, "LiquidityAdded");

            // ------------------ Add liquidity: unbalanced ------------------

            const lpTokenUserBalanceBefore = await stablePoolContract.balanceOf(user.address);
            console.log("User LP Token Balance Before:", lpTokenUserBalanceBefore.toString());

            minBptAmountOut = parseUnits("50", 18);
            depositAmount = parseUnits("200", 18);
            // Allocate tokens to the user
            await batchAllocateTokensTo([newToken], user, depositAmount);
            // Approve tokens for the router
            await batchApproveTokens([newToken], user, routerContract.address, depositAmount);

            maxAmountsIn = tokens.map((token) => {
                return token === newToken ? depositAmount : Zero;
            });
            // Create the add liquidity transaction: unbalanced
            const addLiquidityUnbalancedTx = await routerContract.connect(user).addLiquidityUnbalanced(
                stablePoolContract.address,
                maxAmountsIn,
                minBptAmountOut,
                false, // weth is eth
                HashZero // no additional user data
            );

            await addLiquidityUnbalancedTx.wait();

            await expect(addLiquidityUnbalancedTx).to.emit(vaultContract, "LiquidityAdded");

            const lpTokenUserBalanceAfter = await stablePoolContract.balanceOf(user.address);
            console.log("User LP Token Balance After:", lpTokenUserBalanceAfter.toString());
        });
    });
});
