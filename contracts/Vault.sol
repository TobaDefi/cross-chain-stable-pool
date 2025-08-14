// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.24;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Proxy} from "@openzeppelin/contracts/proxy/Proxy.sol";

import {IProtocolFeeController} from "./interfaces/IProtocolFeeController.sol";
import {IVaultExtension} from "./interfaces/IVaultExtension.sol";
import {IPoolLiquidity} from "./interfaces/IPoolLiquidity.sol";
import {IAuthorizer} from "./interfaces/IAuthorizer.sol";
import {IVaultAdmin} from "./interfaces/IVaultAdmin.sol";
import {IVaultMain} from "./interfaces/IVaultMain.sol";
import {IBasePool} from "./interfaces/IBasePool.sol";
import "./common/VaultTypes.sol";

import {StorageSlotExtension} from "./libs/StorageSlotExtension.sol";
import {PackedTokenBalance} from "./libs/PackedTokenBalance.sol";
import {ScalingHelpers} from "./libs/ScalingHelpers.sol";
import {CastingHelpers} from "./libs/CastingHelpers.sol";
import {BufferHelpers} from "./libs/BufferHelpers.sol";
import {InputHelpers} from "./libs/InputHelpers.sol";
import {FixedPoint} from "./libs/FixedPoint.sol";
import {TransientStorageHelpers} from "./libs/TransientStorageHelpers.sol";

import {VaultStateLib, VaultStateBits} from "./libs/VaultStateLib.sol";
import {PoolConfigLib} from "./libs/PoolConfigLib.sol";
import {PoolDataLib} from "./libs/PoolDataLib.sol";
import {BasePoolMath} from "./libs/BasePoolMath.sol";
import {VaultCommon} from "./common/VaultCommon.sol";

contract Vault is IVaultMain, VaultCommon, Proxy {
    using PackedTokenBalance for bytes32;
    using BufferHelpers for bytes32;
    using InputHelpers for uint256;
    using FixedPoint for *;
    using Address for *;
    using CastingHelpers for uint256[];
    using SafeCast for *;
    using SafeERC20 for IERC20;
    using PoolConfigLib for PoolConfigBits;
    using VaultStateLib for VaultStateBits;
    using ScalingHelpers for *;
    using TransientStorageHelpers for *;
    using StorageSlotExtension for *;
    using PoolDataLib for PoolData;

    // Local reference to the Proxy pattern Vault extension contract.
    IVaultExtension private immutable _vaultExtension;

    constructor(IVaultExtension vaultExtension, IAuthorizer authorizer, IProtocolFeeController protocolFeeController) {
        if (address(vaultExtension.vault()) != address(this)) {
            revert WrongVaultExtensionDeployment();
        }

        if (address(protocolFeeController.vault()) != address(this)) {
            revert WrongProtocolFeeControllerDeployment();
        }

        _vaultExtension = vaultExtension;
        _protocolFeeController = protocolFeeController;

        _vaultPauseWindowEndTime = IVaultAdmin(address(vaultExtension)).getPauseWindowEndTime();
        _vaultBufferPeriodDuration = IVaultAdmin(address(vaultExtension)).getBufferPeriodDuration();
        _vaultBufferPeriodEndTime = IVaultAdmin(address(vaultExtension)).getBufferPeriodEndTime();

        _MINIMUM_TRADE_AMOUNT = IVaultAdmin(address(vaultExtension)).getMinimumTradeAmount();
        _MINIMUM_WRAP_AMOUNT = IVaultAdmin(address(vaultExtension)).getMinimumWrapAmount();

        _authorizer = authorizer;
    }

    /*******************************************************************************
                              Transient Accounting
    *******************************************************************************/

    /**
     * @dev This modifier is used for functions that temporarily modify the token deltas
     * of the Vault, but expect to revert or settle balances by the end of their execution.
     * It works by ensuring that the balances are properly settled by the time the last
     * operation is executed.
     *
     * This is useful for functions like `unlock`, which perform arbitrary external calls:
     * we can keep track of temporary deltas changes, and make sure they are settled by the
     * time the external call is complete.
     */
    modifier transient() {
        bool isUnlockedBefore = _isUnlocked().tload();

        if (isUnlockedBefore == false) {
            _isUnlocked().tstore(true);
        }

        // The caller does everything here and has to settle all outstanding balances.
        _;

        if (isUnlockedBefore == false) {
            if (_nonZeroDeltaCount().tload() != 0) {
                revert BalanceNotSettled();
            }

            _isUnlocked().tstore(false);

            // If a user adds liquidity to a pool, then does a proportional withdrawal from that pool during the same
            // interaction, the system charges a "round-trip" fee on the withdrawal. This fee makes it harder for an
            // user to add liquidity to a pool using a virtually infinite flash loan, swapping in the same pool in a way
            // that benefits him and removes liquidity in the same transaction, which is not a valid use case.
            //
            // Here we introduce the "session" concept, to prevent this fee from being charged accidentally. For
            // example, if an aggregator or account abstraction contract bundled several unrelated operations in the
            // same transaction that involved the same pool with different senders, the guardrail could be triggered
            // for a user doing a simple withdrawal. If proper limits were set, the whole transaction would revert,
            // and if they were not, the user would be unfairly "taxed."
            //
            // Defining an "interaction" this way - as a single `unlock` call vs. an entire transaction - prevents the
            // guardrail from being triggered in the cases described above.

            // Increase session counter after locking the Vault.
            _sessionIdSlot().tIncrement();
        }
    }

    /// @inheritdoc IVaultMain
    function unlock(bytes calldata data) external transient returns (bytes memory result) {
        return (msg.sender).functionCall(data);
    }

    /// @inheritdoc IVaultMain
    function settle(IERC20 token, uint256 amountHint) external nonReentrant onlyWhenUnlocked returns (uint256 credit) {
        uint256 reservesBefore = _reservesOf[token];
        uint256 currentReserves = token.balanceOf(address(this));
        _reservesOf[token] = currentReserves;
        credit = currentReserves - reservesBefore;

        // If the given hint is equal or greater to the reserve difference, we just take the actual reserve difference
        // as the paid amount; the actual balance of the tokens in the Vault is what matters here.
        if (credit > amountHint) {
            // If the difference in reserves is higher than the amount claimed to be paid by the caller, there was some
            // leftover that had been sent to the Vault beforehand, which was not incorporated into the reserves.
            // In that case, we simply discard the leftover by considering the given hint as the amount paid.
            // In turn, this gives the caller credit for the given amount hint, which is what the caller is expecting.
            credit = amountHint;
        }

        _supplyCredit(token, credit);
    }

    /// @inheritdoc IVaultMain
    function sendTo(IERC20 token, address to, uint256 amount) external nonReentrant onlyWhenUnlocked {
        _takeDebt(token, amount);
        _reservesOf[token] -= amount;

        token.safeTransfer(to, amount);
    }

    /*******************************************************************************
                                    Pool Operations
    *******************************************************************************/

    // The Vault performs all upscaling and downscaling (due to token decimals, rates, etc.), so that the pools
    // don't have to. However, scaling inevitably leads to rounding errors, so we take great care to ensure that
    // any rounding errors favor the Vault. An important invariant of the system is that there is no repeatable
    // path where tokensOut > tokensIn.
    //
    // In general, this means rounding up any values entering the Vault, and rounding down any values leaving
    // the Vault, so that external users either pay a little extra or receive a little less in the case of a
    // rounding error.
    //
    // However, it's not always straightforward to determine the correct rounding direction, given the presence
    // and complexity of intermediate steps. An "amountIn" sounds like it should be rounded up: but only if that
    // is the amount actually being transferred. If instead it is an amount sent to the pool math, where rounding
    // up would result in a *higher* calculated amount out, that would favor the user instead of the Vault. So in
    // that case, amountIn should be rounded down.
    //
    // See comments justifying the rounding direction in each case.
    //
    // This reasoning applies to Weighted Pool math, and is likely to apply to others as well, but of course
    // it's possible a new pool type might not conform. Duplicate the tests for new pool types (e.g., Stable Math).
    // Also, the final code should ensure that we are not relying entirely on the rounding directions here,
    // but have enough additional layers (e.g., minimum amounts, buffer wei on all transfers) to guarantee safety,
    // even if it turns out these directions are incorrect for a new pool type.

    /*******************************************************************************
                                          Swaps
    *******************************************************************************/

    /// @inheritdoc IVaultMain
    function swap(
        VaultSwapParams memory vaultSwapParams
    )
        external
        onlyWhenUnlocked
        withInitializedPool(vaultSwapParams.pool)
        returns (uint256 amountCalculated, uint256 amountIn, uint256 amountOut)
    {
        _ensureUnpaused(vaultSwapParams.pool);

        if (vaultSwapParams.amountGivenRaw == 0) {
            revert AmountGivenZero();
        }

        if (vaultSwapParams.tokenIn == vaultSwapParams.tokenOut) {
            revert CannotSwapSameToken();
        }

        // `_loadPoolDataUpdatingBalancesAndYieldFees` is non-reentrant, as it updates storage as well
        // as filling in poolData in memory. Since the swap hooks are reentrant and could do anything, including
        // change these balances, we cannot defer settlement until `_swap`.
        //
        // Sets all fields in `poolData`. Side effects: updates `_poolTokenBalances`, `_aggregateFeeAmounts`
        // in storage.
        PoolData memory poolData = _loadPoolDataUpdatingBalancesAndYieldFees(vaultSwapParams.pool, Rounding.ROUND_DOWN);
        SwapState memory swapState = _loadSwapState(vaultSwapParams, poolData);
        PoolSwapParams memory poolSwapParams = _buildPoolSwapParams(vaultSwapParams, swapState, poolData);

        // Non-reentrant call that updates accounting.
        // The following side-effects are important to note:
        // PoolData balancesRaw and balancesLiveScaled18 are adjusted for swap amounts and fees inside of _swap.
        uint256 amountCalculatedScaled18;
        (amountCalculated, amountCalculatedScaled18, amountIn, amountOut) = _swap(
            vaultSwapParams,
            swapState,
            poolData,
            poolSwapParams
        );

        // The new amount calculated is 'amountCalculated + delta'. If limits are violated, `onAfterSwap` will revert.
        // Uses msg.sender as the Router (the contract that called the Vault).

        if (vaultSwapParams.kind == SwapKind.EXACT_IN) {
            amountOut = amountCalculated;
        } else {
            amountIn = amountCalculated;
        }
    }

    function _loadSwapState(
        VaultSwapParams memory vaultSwapParams,
        PoolData memory poolData
    ) internal pure returns (SwapState memory swapState) {
        swapState.indexIn = _findTokenIndex(poolData.tokens, vaultSwapParams.tokenIn);
        swapState.indexOut = _findTokenIndex(poolData.tokens, vaultSwapParams.tokenOut);

        swapState.amountGivenScaled18 = _computeAmountGivenScaled18(vaultSwapParams, poolData, swapState);
        swapState.swapFeePercentage = poolData.poolConfigBits.getStaticSwapFeePercentage();
    }

    function _buildPoolSwapParams(
        VaultSwapParams memory vaultSwapParams,
        SwapState memory swapState,
        PoolData memory poolData
    ) internal view returns (PoolSwapParams memory) {
        // Uses msg.sender as the Router (the contract that called the Vault).
        return
            PoolSwapParams({
                kind: vaultSwapParams.kind,
                amountGivenScaled18: swapState.amountGivenScaled18,
                balancesScaled18: poolData.balancesLiveScaled18,
                indexIn: swapState.indexIn,
                indexOut: swapState.indexOut,
                router: msg.sender,
                userData: vaultSwapParams.userData
            });
    }

    /**
     * @dev Preconditions: decimalScalingFactors and tokenRates in `poolData` must be current.
     * Uses amountGivenRaw and kind from `vaultSwapParams`.
     */
    function _computeAmountGivenScaled18(
        VaultSwapParams memory vaultSwapParams,
        PoolData memory poolData,
        SwapState memory swapState
    ) internal pure returns (uint256) {
        // If the amountGiven is entering the pool math (ExactIn), round down, since a lower apparent amountIn leads
        // to a lower calculated amountOut, favoring the pool.
        return
            vaultSwapParams.kind == SwapKind.EXACT_IN
                ? vaultSwapParams.amountGivenRaw.toScaled18ApplyRateRoundDown(
                    poolData.decimalScalingFactors[swapState.indexIn],
                    poolData.tokenRates[swapState.indexIn]
                )
                : vaultSwapParams.amountGivenRaw.toScaled18ApplyRateRoundUp(
                    poolData.decimalScalingFactors[swapState.indexOut],
                    // If the swap is ExactOut, the amountGiven is the amount of tokenOut. So, we want to use the rate
                    // rounded up to calculate the amountGivenScaled18, because if this value is bigger, the
                    // amountCalculatedRaw will be bigger, implying that the user will pay for any rounding
                    // inconsistency, and not the Vault.
                    poolData.tokenRates[swapState.indexOut].computeRateRoundUp()
                );
    }

    /**
     * @dev Auxiliary struct to prevent stack-too-deep issues inside `_swap` function.
     * Total swap fees include LP (pool) fees and aggregate (protocol + pool creator) fees.
     */
    struct SwapInternalLocals {
        uint256 totalSwapFeeAmountScaled18;
        uint256 totalSwapFeeAmountRaw;
        uint256 aggregateFeeAmountRaw;
    }

    /**
     * @dev Main non-reentrant portion of the swap, which calls the pool hook and updates accounting. `vaultSwapParams`
     * are passed to the pool's `onSwap` hook.
     *
     * Preconditions: complete `SwapParams`, `SwapState`, and `PoolData`.
     * Side effects: mutates balancesRaw and balancesLiveScaled18 in `poolData`.
     * Updates `_aggregateFeeAmounts`, and `_poolTokenBalances` in storage.
     * Emits Swap event.
     */
    function _swap(
        VaultSwapParams memory vaultSwapParams,
        SwapState memory swapState,
        PoolData memory poolData,
        PoolSwapParams memory poolSwapParams
    )
        internal
        nonReentrant
        returns (
            uint256 amountCalculatedRaw,
            uint256 amountCalculatedScaled18,
            uint256 amountInRaw,
            uint256 amountOutRaw
        )
    {
        SwapInternalLocals memory locals;

        if (vaultSwapParams.kind == SwapKind.EXACT_IN) {
            // Round up to avoid losses during precision loss.
            locals.totalSwapFeeAmountScaled18 = poolSwapParams.amountGivenScaled18.mulUp(swapState.swapFeePercentage);
            poolSwapParams.amountGivenScaled18 -= locals.totalSwapFeeAmountScaled18;
        }

        _ensureValidSwapAmount(poolSwapParams.amountGivenScaled18);

        // Perform the swap request hook and compute the new balances for 'token in' and 'token out' after the swap.
        amountCalculatedScaled18 = IBasePool(vaultSwapParams.pool).onSwap(poolSwapParams);

        _ensureValidSwapAmount(amountCalculatedScaled18);

        // Note that balances are kept in memory, and are not fully computed until the `setPoolBalances` below.
        // Intervening code cannot read balances from storage, as they are temporarily out-of-sync here. This function
        // is nonReentrant, to guard against read-only reentrancy issues.

        // (1) and (2): get raw amounts and check limits.
        if (vaultSwapParams.kind == SwapKind.EXACT_IN) {
            // Restore the original input value; this function should not mutate memory inputs.
            // At this point swap fee amounts have already been computed for EXACT_IN.
            poolSwapParams.amountGivenScaled18 = swapState.amountGivenScaled18;

            // For `ExactIn` the amount calculated is leaving the Vault, so we round down.
            amountCalculatedRaw = amountCalculatedScaled18.toRawUndoRateRoundDown(
                poolData.decimalScalingFactors[swapState.indexOut],
                // If the swap is ExactIn, the amountCalculated is the amount of tokenOut. So, we want to use the rate
                // rounded up to calculate the amountCalculatedRaw, because scale down (undo rate) is a division, the
                // larger the rate, the smaller the amountCalculatedRaw. So, any rounding imprecision will stay in the
                // Vault and not be drained by the user.
                poolData.tokenRates[swapState.indexOut].computeRateRoundUp()
            );

            (amountInRaw, amountOutRaw) = (vaultSwapParams.amountGivenRaw, amountCalculatedRaw);

            if (amountOutRaw < vaultSwapParams.limitRaw) {
                revert SwapLimit(amountOutRaw, vaultSwapParams.limitRaw);
            }
        } else {
            // To ensure symmetry with EXACT_IN, the swap fee used by ExactOut is
            // `amountCalculated * fee% / (100% - fee%)`. Add it to the calculated amountIn. Round up to avoid losing
            // value due to precision loss. Note that if the `swapFeePercentage` were 100% here, this would revert with
            // division by zero. We protect against this by ensuring in PoolConfigLib and HooksConfigLib that all swap
            // fees (static, dynamic, pool creator, and aggregate) are less than 100%.
            locals.totalSwapFeeAmountScaled18 = amountCalculatedScaled18.mulDivUp(
                swapState.swapFeePercentage,
                swapState.swapFeePercentage.complement()
            );

            amountCalculatedScaled18 += locals.totalSwapFeeAmountScaled18;

            // For `ExactOut` the amount calculated is entering the Vault, so we round up.
            amountCalculatedRaw = amountCalculatedScaled18.toRawUndoRateRoundUp(
                poolData.decimalScalingFactors[swapState.indexIn],
                poolData.tokenRates[swapState.indexIn]
            );

            (amountInRaw, amountOutRaw) = (amountCalculatedRaw, vaultSwapParams.amountGivenRaw);

            if (amountInRaw > vaultSwapParams.limitRaw) {
                revert SwapLimit(amountInRaw, vaultSwapParams.limitRaw);
            }
        }

        // 3) Deltas: debit for token in, credit for token out.
        _takeDebt(vaultSwapParams.tokenIn, amountInRaw);
        _supplyCredit(vaultSwapParams.tokenOut, amountOutRaw);

        // 4) Compute and charge protocol and creator fees.
        // Note that protocol fee storage is updated before balance storage, as the final raw balances need to take
        // the fees into account.
        (locals.totalSwapFeeAmountRaw, locals.aggregateFeeAmountRaw) = _computeAndChargeAggregateSwapFees(
            poolData,
            locals.totalSwapFeeAmountScaled18,
            vaultSwapParams.pool,
            vaultSwapParams.tokenIn,
            swapState.indexIn
        );

        // 5) Pool balances: raw and live.

        poolData.updateRawAndLiveBalance(
            swapState.indexIn,
            poolData.balancesRaw[swapState.indexIn] + amountInRaw - locals.aggregateFeeAmountRaw,
            Rounding.ROUND_DOWN
        );
        poolData.updateRawAndLiveBalance(
            swapState.indexOut,
            poolData.balancesRaw[swapState.indexOut] - amountOutRaw,
            Rounding.ROUND_DOWN
        );

        // 6) Store pool balances, raw and live (only index in and out).
        mapping(uint256 tokenIndex => bytes32 packedTokenBalance) storage poolBalances = _poolTokenBalances[
            vaultSwapParams.pool
        ];
        poolBalances[swapState.indexIn] = PackedTokenBalance.toPackedBalance(
            poolData.balancesRaw[swapState.indexIn],
            poolData.balancesLiveScaled18[swapState.indexIn]
        );
        poolBalances[swapState.indexOut] = PackedTokenBalance.toPackedBalance(
            poolData.balancesRaw[swapState.indexOut],
            poolData.balancesLiveScaled18[swapState.indexOut]
        );

        // 7) Off-chain events.
        emit Swap(
            vaultSwapParams.pool,
            vaultSwapParams.tokenIn,
            vaultSwapParams.tokenOut,
            amountInRaw,
            amountOutRaw,
            swapState.swapFeePercentage,
            locals.totalSwapFeeAmountRaw
        );
    }

    /***************************************************************************
                                   Add New Token
    ***************************************************************************/

    function addTokenToPool(
        AddTokenToPoolParams memory params
    ) external override returns (uint256 bptAmountOut, uint256 tokenIndex) {
        IERC20 token = params.tokenConfig.token;

        // Add token to the pool's token array
        _poolTokens[params.pool].push(token);

        // Add the token to the pool's token info mapping
        TokenInfo memory tokenInfo = TokenInfo({
            tokenType: params.tokenConfig.tokenType,
            rateProvider: params.tokenConfig.rateProvider,
            paysYieldFees: params.tokenConfig.paysYieldFees
        });
        _poolTokenInfo[params.pool][token] = tokenInfo;

        tokenIndex = _poolTokens[params.pool].length - 1;

        // Initialize balances for the new token
        _poolTokenBalances[params.pool][tokenIndex] = PackedTokenBalance.toPackedBalance(
            params.exactAmountIn,
            params.exactAmountIn
        );

        // If there is initial liquidity - calculate BPT. Add if (initialAmount > 0) {} else {revert()}
        // Load pool data for calculations
        // NOTE: try PoolData memory poolData = _loadPoolData(pool, Rounding.ROUND_DOWN);
        PoolData memory poolData = _loadPoolData(params.pool, Rounding.ROUND_DOWN);
        // @ todo wip
        // PoolData memory _poolData = _loadPoolDataUpdatingBalancesAndYieldFees(pool, Rounding.ROUND_UP);

        // Total number of tokens in the pool (number of assets)
        uint256 numTokens = poolData.tokens.length;

        // Array of input token amounts for BPT calculation (all zero except for the last)
        uint256[] memory exactAmountsIn = new uint256[](numTokens);
        exactAmountsIn[tokenIndex] = params.exactAmountIn;
        // Do I really need to check the length of the array of all tokens or can I pass just one token that I'm adding?!
        InputHelpers.ensureInputLengthMatch(numTokens, exactAmountsIn.length);

        uint256[] memory exactAmountsInScaled18 = exactAmountsIn.copyToScaled18ApplyRateRoundDownArray(
            poolData.decimalScalingFactors,
            poolData.tokenRates
        );

        IERC20 actualToken = poolData.tokens[tokenIndex];

        _takeDebt(actualToken, exactAmountsIn[tokenIndex]);
        mapping(uint256 tokenIndex => bytes32 packedTokenBalance) storage poolBalances = _poolTokenBalances[
            params.pool
        ];

        poolBalances[tokenIndex] = PackedTokenBalance.toPackedBalance(
            exactAmountsIn[tokenIndex],
            exactAmountsInScaled18[tokenIndex]
        );

        uint256 totalSupply_ = _totalSupply(params.pool);
        exactAmountsInScaled18[tokenIndex] = 0;

        bptAmountOut = IBasePool(params.pool).computeInvariant(poolData.balancesLiveScaled18, Rounding.ROUND_DOWN);

        bptAmountOut = bptAmountOut - totalSupply_; // <<< Adjust for the current total supply

        _mint(params.pool, msg.sender, bptAmountOut);

        emit AddedNewTokenToPool(params.pool, address(token), tokenIndex);
    }

    /***************************************************************************
                                   Add Liquidity
    ***************************************************************************/

    /// @inheritdoc IVaultMain
    function addLiquidity(
        AddLiquidityParams memory params
    )
        external
        onlyWhenUnlocked
        withInitializedPool(params.pool)
        returns (uint256[] memory amountsIn, uint256 bptAmountOut, bytes memory returnData)
    {
        // Round balances up when adding liquidity:
        // If proportional, higher balances = higher proportional amountsIn, favoring the pool.
        // If unbalanced, higher balances = lower invariant ratio with fees.
        // bptOut = supply * (ratio - 1), so lower ratio = less bptOut, favoring the pool.

        _ensureUnpaused(params.pool);
        _addLiquidityCalled().tSet(_sessionIdSlot().tload(), params.pool, true);

        // `_loadPoolDataUpdatingBalancesAndYieldFees` is non-reentrant, as it updates storage as well
        // as filling in poolData in memory. Since the add liquidity hooks are reentrant and could do anything,
        // including change these balances, we cannot defer settlement until `_addLiquidity`.
        //
        // Sets all fields in `poolData`. Side effects: updates `_poolTokenBalances`, and
        // `_aggregateFeeAmounts` in storage.
        PoolData memory poolData = _loadPoolDataUpdatingBalancesAndYieldFees(params.pool, Rounding.ROUND_UP);
        InputHelpers.ensureInputLengthMatch(poolData.tokens.length, params.maxAmountsIn.length);

        // Amounts are entering pool math, so round down.
        // Introducing `maxAmountsInScaled18` here and passing it through to _addLiquidity is not ideal,
        // but it avoids the even worse options of mutating amountsIn inside AddLiquidityParams,
        // or cluttering the AddLiquidityParams interface by adding amountsInScaled18.
        uint256[] memory maxAmountsInScaled18 = params.maxAmountsIn.copyToScaled18ApplyRateRoundDownArray(
            poolData.decimalScalingFactors,
            poolData.tokenRates
        );

        // `amountsInScaled18` will be overwritten in the custom case, so we need to pass it back and forth to
        // encapsulate that logic in `_addLiquidity`.
        uint256[] memory amountsInScaled18;
        (amountsIn, amountsInScaled18, bptAmountOut, returnData) = _addLiquidity(
            poolData,
            params,
            maxAmountsInScaled18
        );
    }

    // Avoid "stack too deep" - without polluting the Add/RemoveLiquidity params interface.
    struct LiquidityLocals {
        uint256 numTokens;
        uint256 aggregateSwapFeeAmountRaw;
        uint256 tokenIndex;
    }

    /**
     * @dev Calls the appropriate pool hook and calculates the required inputs and outputs for the operation
     * considering the given kind, and updates the Vault's internal accounting. This includes:
     * - Setting pool balances
     * - Taking debt from the liquidity provider
     * - Minting pool tokens
     * - Emitting events
     *
     * It is non-reentrant, as it performs external calls and updates the Vault's state accordingly.
     */
    function _addLiquidity(
        PoolData memory poolData,
        AddLiquidityParams memory params,
        uint256[] memory maxAmountsInScaled18
    )
        internal
        nonReentrant
        returns (
            uint256[] memory amountsInRaw,
            uint256[] memory amountsInScaled18,
            uint256 bptAmountOut,
            bytes memory returnData
        )
    {
        LiquidityLocals memory locals;
        locals.numTokens = poolData.tokens.length;
        amountsInRaw = new uint256[](locals.numTokens);
        // `swapFeeAmounts` stores scaled18 amounts first, and is then reused to store raw amounts.
        uint256[] memory swapFeeAmounts;

        if (params.kind == AddLiquidityKind.PROPORTIONAL) {
            bptAmountOut = params.minBptAmountOut;
            // Initializes the swapFeeAmounts empty array (no swap fees on proportional add liquidity).
            swapFeeAmounts = new uint256[](locals.numTokens);

            amountsInScaled18 = BasePoolMath.computeProportionalAmountsIn(
                poolData.balancesLiveScaled18,
                _totalSupply(params.pool),
                bptAmountOut
            );
        } else if (params.kind == AddLiquidityKind.DONATION) {
            poolData.poolConfigBits.requireDonationEnabled();

            swapFeeAmounts = new uint256[](maxAmountsInScaled18.length);
            bptAmountOut = 0;
            amountsInScaled18 = maxAmountsInScaled18;
        } else if (params.kind == AddLiquidityKind.UNBALANCED) {
            poolData.poolConfigBits.requireUnbalancedLiquidityEnabled();

            amountsInScaled18 = maxAmountsInScaled18;
            // Deep copy given max amounts in raw to calculated amounts in raw to avoid scaling later, ensuring that
            // `maxAmountsIn` is preserved.
            ScalingHelpers.copyToArray(params.maxAmountsIn, amountsInRaw);

            (bptAmountOut, swapFeeAmounts) = BasePoolMath.computeAddLiquidityUnbalanced(
                poolData.balancesLiveScaled18,
                maxAmountsInScaled18,
                _totalSupply(params.pool),
                poolData.poolConfigBits.getStaticSwapFeePercentage(),
                IBasePool(params.pool)
            );
        } else if (params.kind == AddLiquidityKind.SINGLE_TOKEN_EXACT_OUT) {
            poolData.poolConfigBits.requireUnbalancedLiquidityEnabled();

            bptAmountOut = params.minBptAmountOut;
            locals.tokenIndex = InputHelpers.getSingleInputIndex(maxAmountsInScaled18);

            amountsInScaled18 = maxAmountsInScaled18;
            (amountsInScaled18[locals.tokenIndex], swapFeeAmounts) = BasePoolMath
                .computeAddLiquiditySingleTokenExactOut(
                    poolData.balancesLiveScaled18,
                    locals.tokenIndex,
                    bptAmountOut,
                    _totalSupply(params.pool),
                    poolData.poolConfigBits.getStaticSwapFeePercentage(),
                    IBasePool(params.pool)
                );
        } else if (params.kind == AddLiquidityKind.CUSTOM) {
            poolData.poolConfigBits.requireAddLiquidityCustomEnabled();

            // Uses msg.sender as the Router (the contract that called the Vault).
            (amountsInScaled18, bptAmountOut, swapFeeAmounts, returnData) = IPoolLiquidity(params.pool)
                .onAddLiquidityCustom(
                    msg.sender,
                    maxAmountsInScaled18,
                    params.minBptAmountOut,
                    poolData.balancesLiveScaled18,
                    params.userData
                );
        } else {
            revert InvalidAddLiquidityKind();
        }

        // At this point we have the calculated BPT amount.
        if (bptAmountOut < params.minBptAmountOut) {
            revert BptAmountOutBelowMin(bptAmountOut, params.minBptAmountOut);
        }

        _ensureValidTradeAmount(bptAmountOut);

        for (uint256 i = 0; i < locals.numTokens; ++i) {
            uint256 amountInRaw;

            // 1) Calculate raw amount in.
            {
                uint256 amountInScaled18 = amountsInScaled18[i];
                _ensureValidTradeAmount(amountInScaled18);

                // If the value in memory is not set, convert scaled amount to raw.
                if (amountsInRaw[i] == 0) {
                    // amountsInRaw are amounts actually entering the Pool, so we round up.
                    // Do not mutate in place yet, as we need them scaled for the `onAfterAddLiquidity` hook.
                    amountInRaw = amountInScaled18.toRawUndoRateRoundUp(
                        poolData.decimalScalingFactors[i],
                        poolData.tokenRates[i]
                    );

                    amountsInRaw[i] = amountInRaw;
                } else {
                    // Exact in requests will have the raw amount in memory already, so we use it moving forward and
                    // skip downscaling.
                    amountInRaw = amountsInRaw[i];
                }
            }

            IERC20 token = poolData.tokens[i];

            // 2) Check limits for raw amounts.
            if (amountInRaw > params.maxAmountsIn[i]) {
                revert AmountInAboveMax(token, amountInRaw, params.maxAmountsIn[i]);
            }

            // 3) Deltas: Debit of token[i] for amountInRaw.
            _takeDebt(token, amountInRaw);

            // 4) Compute and charge protocol and creator fees.
            // swapFeeAmounts[i] is now raw instead of scaled.
            (swapFeeAmounts[i], locals.aggregateSwapFeeAmountRaw) = _computeAndChargeAggregateSwapFees(
                poolData,
                swapFeeAmounts[i],
                params.pool,
                token,
                i
            );

            // 5) Pool balances: raw and live.
            // We need regular balances to complete the accounting, and the upscaled balances
            // to use in the `after` hook later on.

            // A pool's token balance increases by amounts in after adding liquidity, minus fees.
            poolData.updateRawAndLiveBalance(
                i,
                poolData.balancesRaw[i] + amountInRaw - locals.aggregateSwapFeeAmountRaw,
                Rounding.ROUND_DOWN
            );
        }

        // 6) Store pool balances, raw and live.
        _writePoolBalancesToStorage(params.pool, poolData);

        // 7) BPT supply adjustment.
        // When adding liquidity, we must mint tokens concurrently with updating pool balances,
        // as the pool's math relies on totalSupply.
        _mint(address(params.pool), params.to, bptAmountOut);

        // 8) Off-chain events.
        emit LiquidityAdded(
            params.pool,
            params.to,
            params.kind,
            _totalSupply(params.pool),
            amountsInRaw,
            swapFeeAmounts
        );
    }

    /***************************************************************************
                                 Remove Liquidity
    ***************************************************************************/

    /// @inheritdoc IVaultMain
    function removeLiquidity(
        RemoveLiquidityParams memory params
    )
        external
        onlyWhenUnlocked
        withInitializedPool(params.pool)
        returns (uint256 bptAmountIn, uint256[] memory amountsOut, bytes memory returnData)
    {
        // Round down when removing liquidity:
        // If proportional, lower balances = lower proportional amountsOut, favoring the pool.
        // If unbalanced, lower balances = lower invariant ratio without fees.
        // bptIn = supply * (1 - ratio), so lower ratio = more bptIn, favoring the pool.
        _ensureUnpaused(params.pool);

        // `_loadPoolDataUpdatingBalancesAndYieldFees` is non-reentrant, as it updates storage as well
        // as filling in poolData in memory. Since the swap hooks are reentrant and could do anything, including
        // change these balances, we cannot defer settlement until `_removeLiquidity`.
        //
        // Sets all fields in `poolData`. Side effects: updates `_poolTokenBalances` and
        // `_aggregateFeeAmounts in storage.
        PoolData memory poolData = _loadPoolDataUpdatingBalancesAndYieldFees(params.pool, Rounding.ROUND_DOWN);
        InputHelpers.ensureInputLengthMatch(poolData.tokens.length, params.minAmountsOut.length);

        // Amounts are entering pool math; higher amounts would burn more BPT, so round up to favor the pool.
        // Do not mutate minAmountsOut, so that we can directly compare the raw limits later, without potentially
        // losing precision by scaling up and then down.
        uint256[] memory minAmountsOutScaled18 = params.minAmountsOut.copyToScaled18ApplyRateRoundUpArray(
            poolData.decimalScalingFactors,
            poolData.tokenRates
        );

        uint256[] memory amountsOutScaled18;
        (bptAmountIn, amountsOut, amountsOutScaled18, returnData) = _removeLiquidity(
            poolData,
            params,
            minAmountsOutScaled18
        );
    }

    /**
     * @dev Calls the appropriate pool hook and calculates the required inputs and outputs for the operation
     * considering the given kind, and updates the Vault's internal accounting. This includes:
     * - Setting pool balances
     * - Supplying credit to the liquidity provider
     * - Burning pool tokens
     * - Emitting events
     *
     * It is non-reentrant, as it performs external calls and updates the Vault's state accordingly.
     */
    function _removeLiquidity(
        PoolData memory poolData,
        RemoveLiquidityParams memory params,
        uint256[] memory minAmountsOutScaled18
    )
        internal
        nonReentrant
        returns (
            uint256 bptAmountIn,
            uint256[] memory amountsOutRaw,
            uint256[] memory amountsOutScaled18,
            bytes memory returnData
        )
    {
        LiquidityLocals memory locals;
        locals.numTokens = poolData.tokens.length;
        amountsOutRaw = new uint256[](locals.numTokens);
        // `swapFeeAmounts` stores scaled18 amounts first, and is then reused to store raw amounts.
        uint256[] memory swapFeeAmounts;

        if (params.kind == RemoveLiquidityKind.PROPORTIONAL) {
            bptAmountIn = params.maxBptAmountIn;
            swapFeeAmounts = new uint256[](locals.numTokens);
            amountsOutScaled18 = BasePoolMath.computeProportionalAmountsOut(
                poolData.balancesLiveScaled18,
                _totalSupply(params.pool),
                bptAmountIn
            );

            // Charge round-trip fee if liquidity was added to this pool in the same unlock call; this is not really a
            // valid use case, and may be an attack. Use caution when removing liquidity through a Safe or other
            // multisig / non-EOA address. Use "sign and execute," ideally through a private node (or at least not
            // allowing public execution) to avoid front-running, and always set strict limits so that it will revert
            // if any unexpected fees are charged. (It is also possible to check whether the flag has been set before
            // withdrawing, by calling `getAddLiquidityCalledFlag`.)
            if (_addLiquidityCalled().tGet(_sessionIdSlot().tload(), params.pool)) {
                uint256 swapFeePercentage = poolData.poolConfigBits.getStaticSwapFeePercentage();
                for (uint256 i = 0; i < locals.numTokens; ++i) {
                    swapFeeAmounts[i] = amountsOutScaled18[i].mulUp(swapFeePercentage);
                    amountsOutScaled18[i] -= swapFeeAmounts[i];
                }
            }
        } else if (params.kind == RemoveLiquidityKind.SINGLE_TOKEN_EXACT_IN) {
            poolData.poolConfigBits.requireUnbalancedLiquidityEnabled();
            bptAmountIn = params.maxBptAmountIn;
            amountsOutScaled18 = minAmountsOutScaled18;
            locals.tokenIndex = InputHelpers.getSingleInputIndex(params.minAmountsOut);

            (amountsOutScaled18[locals.tokenIndex], swapFeeAmounts) = BasePoolMath
                .computeRemoveLiquiditySingleTokenExactIn(
                    poolData.balancesLiveScaled18,
                    locals.tokenIndex,
                    bptAmountIn,
                    _totalSupply(params.pool),
                    poolData.poolConfigBits.getStaticSwapFeePercentage(),
                    IBasePool(params.pool)
                );
        } else if (params.kind == RemoveLiquidityKind.SINGLE_TOKEN_EXACT_OUT) {
            poolData.poolConfigBits.requireUnbalancedLiquidityEnabled();
            amountsOutScaled18 = minAmountsOutScaled18;
            locals.tokenIndex = InputHelpers.getSingleInputIndex(params.minAmountsOut);
            amountsOutRaw[locals.tokenIndex] = params.minAmountsOut[locals.tokenIndex];

            (bptAmountIn, swapFeeAmounts) = BasePoolMath.computeRemoveLiquiditySingleTokenExactOut(
                poolData.balancesLiveScaled18,
                locals.tokenIndex,
                amountsOutScaled18[locals.tokenIndex],
                _totalSupply(params.pool),
                poolData.poolConfigBits.getStaticSwapFeePercentage(),
                IBasePool(params.pool)
            );
        } else if (params.kind == RemoveLiquidityKind.CUSTOM) {
            poolData.poolConfigBits.requireRemoveLiquidityCustomEnabled();
            // Uses msg.sender as the Router (the contract that called the Vault).
            (bptAmountIn, amountsOutScaled18, swapFeeAmounts, returnData) = IPoolLiquidity(params.pool)
                .onRemoveLiquidityCustom(
                    msg.sender,
                    params.maxBptAmountIn,
                    minAmountsOutScaled18,
                    poolData.balancesLiveScaled18,
                    params.userData
                );
        } else {
            revert InvalidRemoveLiquidityKind();
        }

        if (bptAmountIn > params.maxBptAmountIn) {
            revert BptAmountInAboveMax(bptAmountIn, params.maxBptAmountIn);
        }

        _ensureValidTradeAmount(bptAmountIn);

        for (uint256 i = 0; i < locals.numTokens; ++i) {
            uint256 amountOutRaw;

            // 1) Calculate raw amount out.
            {
                uint256 amountOutScaled18 = amountsOutScaled18[i];
                _ensureValidTradeAmount(amountOutScaled18);

                // If the value in memory is not set, convert scaled amount to raw.
                if (amountsOutRaw[i] == 0) {
                    // amountsOut are amounts exiting the Pool, so we round down.
                    // Do not mutate in place yet, as we need them scaled for the `onAfterRemoveLiquidity` hook.
                    amountOutRaw = amountOutScaled18.toRawUndoRateRoundDown(
                        poolData.decimalScalingFactors[i],
                        poolData.tokenRates[i]
                    );
                    amountsOutRaw[i] = amountOutRaw;
                } else {
                    // Exact out requests will have the raw amount in memory already, so we use it moving forward and
                    // skip downscaling.
                    amountOutRaw = amountsOutRaw[i];
                }
            }

            IERC20 token = poolData.tokens[i];
            // 2) Check limits for raw amounts.
            if (amountOutRaw < params.minAmountsOut[i]) {
                revert AmountOutBelowMin(token, amountOutRaw, params.minAmountsOut[i]);
            }

            // 3) Deltas: Credit token[i] for amountOutRaw.
            _supplyCredit(token, amountOutRaw);

            // 4) Compute and charge protocol and creator fees.
            // swapFeeAmounts[i] is now raw instead of scaled.
            (swapFeeAmounts[i], locals.aggregateSwapFeeAmountRaw) = _computeAndChargeAggregateSwapFees(
                poolData,
                swapFeeAmounts[i],
                params.pool,
                token,
                i
            );

            // 5) Pool balances: raw and live.
            // We need regular balances to complete the accounting, and the upscaled balances
            // to use in the `after` hook later on.

            // A Pool's token balance always decreases after an exit (potentially by 0).
            // Also adjust by protocol and pool creator fees.
            poolData.updateRawAndLiveBalance(
                i,
                poolData.balancesRaw[i] - (amountOutRaw + locals.aggregateSwapFeeAmountRaw),
                Rounding.ROUND_DOWN
            );
        }

        // 6) Store pool balances, raw and live.
        _writePoolBalancesToStorage(params.pool, poolData);

        // 7) BPT supply adjustment.
        // Uses msg.sender as the Router (the contract that called the Vault).
        _spendAllowance(address(params.pool), params.from, msg.sender, bptAmountIn);

        if (_isQueryContext()) {
            // Increase `from` balance to ensure the burn function succeeds.
            _queryModeBalanceIncrease(params.pool, params.from, bptAmountIn);
        }
        // When removing liquidity, we must burn tokens concurrently with updating pool balances,
        // as the pool's math relies on totalSupply.
        // Burning will be reverted if it results in a total supply less than the _POOL_MINIMUM_TOTAL_SUPPLY.
        _burn(address(params.pool), params.from, bptAmountIn);

        // 8) Off-chain events.
        emit LiquidityRemoved(
            params.pool,
            params.from,
            params.kind,
            _totalSupply(params.pool),
            amountsOutRaw,
            swapFeeAmounts
        );
    }

    /**
     * @dev Preconditions: poolConfigBits, decimalScalingFactors, tokenRates in `poolData`.
     * Side effects: updates `_aggregateFeeAmounts` storage.
     * Note that this computes the aggregate total of the protocol fees and stores it, without emitting any events.
     * Splitting the fees and event emission occur during fee collection.
     * Should only be called in a non-reentrant context.
     *
     * @return totalSwapFeeAmountRaw Total swap fees raw (LP + aggregate protocol fees)
     * @return aggregateSwapFeeAmountRaw Sum of protocol and pool creator fees raw
     */
    function _computeAndChargeAggregateSwapFees(
        PoolData memory poolData,
        uint256 totalSwapFeeAmountScaled18,
        address pool,
        IERC20 token,
        uint256 index
    ) internal returns (uint256 totalSwapFeeAmountRaw, uint256 aggregateSwapFeeAmountRaw) {
        // If totalSwapFeeAmountScaled18 equals zero, no need to charge anything.
        if (totalSwapFeeAmountScaled18 > 0) {
            // The total swap fee does not go into the pool; amountIn does, and the raw fee at this point does not
            // modify it. Given that all of the fee may belong to the pool creator (i.e. outside pool balances),
            // we round down to protect the invariant.

            totalSwapFeeAmountRaw = totalSwapFeeAmountScaled18.toRawUndoRateRoundDown(
                poolData.decimalScalingFactors[index],
                poolData.tokenRates[index]
            );

            // Aggregate fees are not charged in Recovery Mode, but we still calculate and return the raw total swap
            // fee above for off-chain reporting purposes.
            if (poolData.poolConfigBits.isPoolInRecoveryMode() == false) {
                uint256 aggregateSwapFeePercentage = poolData.poolConfigBits.getAggregateSwapFeePercentage();

                // We have already calculated raw total fees rounding up.
                // Total fees = LP fees + aggregate fees, so by rounding aggregate fees down we round the fee split in
                // the LPs' favor, in turn increasing token balances and the pool invariant.
                aggregateSwapFeeAmountRaw = totalSwapFeeAmountRaw.mulDown(aggregateSwapFeePercentage);

                // Ensure we can never charge more than the total swap fee.
                if (aggregateSwapFeeAmountRaw > totalSwapFeeAmountRaw) {
                    revert ProtocolFeesExceedTotalCollected();
                }

                // Both Swap and Yield fees are stored together in a PackedTokenBalance.
                // We have designated "Raw" the derived half for Swap fee storage.
                bytes32 currentPackedBalance = _aggregateFeeAmounts[pool][token];
                _aggregateFeeAmounts[pool][token] = currentPackedBalance.setBalanceRaw(
                    currentPackedBalance.getBalanceRaw() + aggregateSwapFeeAmountRaw
                );
            }
        }
    }

    /*******************************************************************************
                                    Pool Information
    *******************************************************************************/

    /// @inheritdoc IVaultMain
    function getPoolTokenCountAndIndexOfToken(
        address pool,
        IERC20 token
    ) external view withRegisteredPool(pool) returns (uint256, uint256) {
        IERC20[] memory poolTokens = _poolTokens[pool];

        uint256 index = _findTokenIndex(poolTokens, token);

        return (poolTokens.length, index);
    }

    /*******************************************************************************
                                 Balancer Pool Tokens
    *******************************************************************************/

    /// @inheritdoc IVaultMain
    function transfer(address owner, address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, owner, to, amount);
        return true;
    }

    /// @inheritdoc IVaultMain
    function transferFrom(address spender, address from, address to, uint256 amount) external returns (bool) {
        _spendAllowance(msg.sender, from, spender, amount);
        _transfer(msg.sender, from, to, amount);
        return true;
    }

    // Minimum token value in or out (applied to scaled18 values), enforced as a security measure to block potential
    // exploitation of rounding errors. This is called in the context of adding or removing liquidity, so zero is
    // allowed to support single-token operations.
    function _ensureValidTradeAmount(uint256 tradeAmount) internal view {
        if (tradeAmount != 0) {
            _ensureValidSwapAmount(tradeAmount);
        }
    }

    // Minimum token value in or out (applied to scaled18 values), enforced as a security measure to block potential
    // exploitation of rounding errors. This is called in the swap context, so zero is not a valid amount. Note that
    // since this is applied to the scaled amount, the corresponding minimum raw amount will vary according to token
    // decimals. The math functions are called with scaled amounts, and the magnitude of the minimum values is based
    // on the maximum error, so this is fine. Trying to adjust for decimals would add complexity and significant gas
    // to the critical path, so we don't do it. (Note that very low-decimal tokens don't work well in AMMs generally;
    // this is another reason to avoid them.)
    function _ensureValidSwapAmount(uint256 tradeAmount) internal view {
        if (tradeAmount < _MINIMUM_TRADE_AMOUNT) {
            revert TradeAmountTooSmall();
        }
    }

    /*******************************************************************************
                                     Miscellaneous
    *******************************************************************************/

    /// @inheritdoc IVaultMain
    function getVaultExtension() external view returns (address) {
        return _implementation();
    }

    /**
     * @inheritdoc Proxy
     * @dev Returns the VaultExtension contract, to which fallback requests are forwarded.
     */
    function _implementation() internal view override returns (address) {
        return address(_vaultExtension);
    }

    /*******************************************************************************
                                     Default handlers
    *******************************************************************************/

    receive() external payable {
        revert CannotReceiveEth();
    }

    // solhint-disable no-complex-fallback

    /**
     * @inheritdoc Proxy
     * @dev Override proxy implementation of `fallback` to disallow incoming ETH transfers.
     * This function actually returns whatever the VaultExtension does when handling the request.
     */
    fallback() external payable override {
        if (msg.value > 0) {
            revert CannotReceiveEth();
        }

        _fallback();
    }
}
