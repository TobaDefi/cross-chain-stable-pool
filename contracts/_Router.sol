// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.24;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
// @todo revert this in the future
// import { IPermit2 } from "@uniswap/permit2/src/interfaces/IPermit2.sol";

import {IWETH} from "./interfaces/IWETH.sol";
import {IRouter} from "./interfaces/IRouter.sol";
import {IVault} from "./interfaces/IVault.sol";
import "./common/VaultTypes.sol";

import {RouterWethLib} from "./libs/RouterWethLib.sol";
import {RouterCommon} from "./common/RouterCommon.sol";

import {IGatewayZEVM} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import {MessageContext, UniversalContract} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {IZRC20, IZRC20Metadata} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

/**
 * @notice Entrypoint for swaps, liquidity operations, and corresponding queries.
 * @dev The external API functions unlock the Vault, which calls back into the corresponding hook functions.
 * These interact with the Vault, transfer tokens, settle accounting, and handle wrapping and unwrapping ETH.
 */
contract Router is IRouter, RouterCommon, UniversalContract {
    using Address for address payable;
    using RouterWethLib for IWETH;
    using SafeCast for *;

    /// @notice The Gateway contract address for ZetaChain Testnet
    IGatewayZEVM public constant GATEWAY = IGatewayZEVM(0x6c533f7fE93fAE114d0954697069Df33C9B74fD7);

    /// @notice The Uniswap V2 Router contract address for ZetaChain Testnet
    /// @dev This router is used to swap tokens in the Universal Token Sale.
    address public constant UNISWAP_ROUTER = 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe;

    /// @notice The gas limit for the onRevert function.
    uint256 public constant GAS_LIMIT = 5000000;

    bool internal _initOnColl;
    bool internal _toExternalNetwork;

    /// @notice Error thrown when the caller is not the Gateway contract.
    error NotGateway();

    /// @notice Error thrown when the approval of a token transfer fails.
    error ApprovalFailed(address token, uint256 amount);

    /// @notice Error thrown when the amount is insufficient to cover the gas fee for withdrawal to the external network.
    error InsufficientWithdrawGasFeeAmount();

    error VaultNotRegisteredNetwork(address pool, uint256 chainId);

    /// @notice Modifier that restricts access to the Gateway contract.
    modifier onlyGateway() {
        if (msg.sender != address(GATEWAY)) revert NotGateway();
        _;
    }

    constructor(
        IVault vault,
        IWETH weth,
        // @todo revert this in the future
        // IPermit2 permit2,
        string memory routerVersion
    )
        // @todo revert this in the future
        // ) RouterCommon(vault, weth, permit2, routerVersion) {
        RouterCommon(vault, weth, routerVersion)
    {
        // solhint-disable-previous-line no-empty-blocks
    }

    /*******************************************************************************
                                Gateway Functions
    *******************************************************************************/

    struct Message {
        address pool;
        uint256 minBptAmountOut;
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override saveSender(msg.sender) onlyGateway {
        Message memory _msg = abi.decode(message, (Message));

        IERC20[] memory tokens = _vault.getPoolTokens(_msg.pool);

        uint256[] memory exactAmountsIn = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; ++i) {
            if (address(tokens[i]) == zrc20) {
                exactAmountsIn[i] = amount;
            } else {
                exactAmountsIn[i] = 0;
            }
        }

        _initOnColl = true;

        _vault.unlock(
            abi.encodeCall(
                Router.addLiquidityHook,
                AddLiquidityHookParams({
                    sender: context.senderEVM,
                    pool: _msg.pool,
                    maxAmountsIn: exactAmountsIn,
                    minBptAmountOut: _msg.minBptAmountOut,
                    kind: AddLiquidityKind.UNBALANCED,
                    // @todo check that it is not needed
                    wethIsEth: false,
                    // @todo maybe add some data here?
                    userData: "0x"
                })
            )
        );
        _initOnColl = false;
    }

    /**
     * @notice Transfer tokens to the recipient on ZetaChain or withdraw to a connected chain
     */
    function _withdraw(address sender, address targetToken, uint256 out, address gasZRC20, uint256 gasFee) internal {
        if (gasZRC20 == targetToken) {
            if (!IZRC20(gasZRC20).approve(address(GATEWAY), (out + gasFee))) {
                revert ApprovalFailed(gasZRC20, (out + gasFee));
            }
        } else {
            if (!IZRC20(gasZRC20).approve(address(GATEWAY), gasFee)) {
                revert ApprovalFailed(gasZRC20, gasFee);
            }
            if (!IZRC20(targetToken).approve(address(GATEWAY), out)) {
                revert ApprovalFailed(targetToken, out);
            }
        }

        // @todo implement revert message params
        // RevertMessageParams memory params = RevertMessageParams({
        //     sender: _bytesToAddress(sender),
        //     targetToken: targetToken,
        //     out: out,
        //     gasZRC20: gasZRC20,
        //     gasFee: gasFee
        // });

        GATEWAY.withdraw(
            abi.encodePacked(sender),
            out,
            targetToken,
            RevertOptions({
                // @todo implement revert address
                revertAddress: address(0),
                // @todo implement revert logic
                callOnRevert: false,
                abortAddress: address(0),
                // @todo implement revert message
                revertMessage: "0x",
                onRevertGasLimit: GAS_LIMIT
            })
        );
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        // @todo implement revert logic
    }

    function onAbort(RevertContext calldata context) external onlyGateway {
        // @todo implement abort logic
    }

    /**
     * @notice Swaps enough tokens to pay gas fees, then swaps the remainder to the target token
     */
    function _handleGasAndSwap(
        uint256 amount,
        address targetToken
    ) internal returns (uint256 amountOut, address gasZRC20, uint256 gasFee) {
        (gasZRC20, gasFee) = IZRC20(targetToken).withdrawGasFee();

        // NOTE: If the target token is the gas ZRC20, we can use it directly.
        if (targetToken == gasZRC20) {
            if (amount < gasFee) {
                revert InsufficientWithdrawGasFeeAmount();
            }
            amountOut = amount - gasFee;
        } else {
            // NOTE: If the target token is not the gas ZRC20, we need to swap.
            address wZeta = IUniswapV2Router02(UNISWAP_ROUTER).WETH();
            address[] memory path = new address[](3);

            path = new address[](3);
            path[0] = targetToken;
            path[1] = wZeta;
            path[2] = gasZRC20;

            uint256[] memory amountsIn = IUniswapV2Router02(UNISWAP_ROUTER).getAmountsIn(gasFee, path);

            if (amount < amountsIn[0]) {
                revert InsufficientWithdrawGasFeeAmount();
            }

            uint256 inputForGas = SwapHelperLib.swapTokensForExactTokens(
                UNISWAP_ROUTER,
                targetToken,
                gasFee,
                gasZRC20,
                amount
            );

            amountOut = amount - inputForGas;
        }
    }

    /*******************************************************************************
                                Pool Initialization
    *******************************************************************************/

    /// @inheritdoc IRouter
    function initialize(
        address pool,
        IERC20[] memory tokens,
        uint256[] memory exactAmountsIn,
        uint256 minBptAmountOut,
        bool wethIsEth,
        bytes memory userData
    ) external payable saveSender(msg.sender) returns (uint256 bptAmountOut) {
        return
            abi.decode(
                _vault.unlock(
                    abi.encodeCall(
                        Router.initializeHook,
                        InitializeHookParams({
                            sender: msg.sender,
                            pool: pool,
                            tokens: tokens,
                            exactAmountsIn: exactAmountsIn,
                            minBptAmountOut: minBptAmountOut,
                            wethIsEth: wethIsEth,
                            userData: userData
                        })
                    )
                ),
                (uint256)
            );
    }

    /**
     * @notice Hook for initialization.
     * @dev Can only be called by the Vault.
     * @param params Initialization parameters (see IRouter for struct definition)
     * @return bptAmountOut BPT amount minted in exchange for the input tokens
     */
    function initializeHook(
        InitializeHookParams calldata params
    ) external nonReentrant onlyVault returns (uint256 bptAmountOut) {
        bptAmountOut = _vault.initialize(
            params.pool,
            params.sender,
            params.tokens,
            params.exactAmountsIn,
            params.minBptAmountOut,
            params.userData
        );

        for (uint256 i = 0; i < params.tokens.length; ++i) {
            IERC20 token = params.tokens[i];
            uint256 amountIn = params.exactAmountsIn[i];

            if (amountIn == 0) {
                continue;
            }

            // There can be only one WETH token in the pool.
            if (params.wethIsEth && address(token) == address(_weth)) {
                _weth.wrapEthAndSettle(_vault, amountIn);
            } else {
                // Transfer tokens from the user to the Vault.
                // Any value over MAX_UINT128 would revert above in `initialize`, so this SafeCast shouldn't be
                // necessary. Done out of an abundance of caution.
                // @todo revert this in the future
                // _permit2.transferFrom(params.sender, address(_vault), amountIn.toUint160(), address(token));
                IERC20(token).transferFrom(params.sender, address(_vault), amountIn.toUint160());
                _vault.settle(token, amountIn);
            }
        }

        // Return ETH dust.
        _returnEth(params.sender);
    }

    /***************************************************************************
                                   Add Token To Pool
    ***************************************************************************/
    // @todo implement this function
    error Todo();

    function addTokenToPool(
        address pool,
        TokenConfig memory tokenConfig,
        uint256 exactAmountIn
    ) external saveSender(msg.sender) returns (uint256 bptAmountOut) {
        (bptAmountOut, ) = abi.decode(
            _vault.unlock(
                abi.encodeCall(
                    Router.addTokenToPoolHook,
                    AddTokenToPoolHookParams({
                        pool: pool,
                        sender: msg.sender,
                        tokenConfig: tokenConfig,
                        exactAmountIn: exactAmountIn
                    })
                )
            ),
            (uint256, uint256)
        );
    }

    function addTokenToPoolHook(
        AddTokenToPoolHookParams calldata params
    ) external nonReentrant onlyVault returns (uint256 bptAmountOut, uint256 tokenIndex) {
        (bptAmountOut, tokenIndex) = _vault.addTokenToPool(
            AddTokenToPoolParams({
                pool: params.pool,
                sender: params.sender,
                tokenConfig: params.tokenConfig,
                exactAmountIn: params.exactAmountIn
            })
        );

        // @todo need to implement revert reason
        if (params.exactAmountIn == 0) revert Todo();

        IERC20[] memory tokens = _vault.getPoolTokens(params.pool);

        // @todo need to implement revert reason
        if (tokenIndex > tokens.length - 1) revert Todo();

        IERC20(tokens[tokenIndex]).transferFrom(params.sender, address(_vault), params.exactAmountIn.toUint160());
        _vault.settle(tokens[tokenIndex], params.exactAmountIn);
    }

    /***************************************************************************
                                   Add Liquidity
    ***************************************************************************/

    /// @inheritdoc IRouter
    function addLiquidityProportional(
        address pool,
        uint256[] memory maxAmountsIn,
        uint256 exactBptAmountOut,
        bool wethIsEth,
        bytes memory userData
    ) external payable saveSender(msg.sender) returns (uint256[] memory amountsIn) {
        (amountsIn, , ) = abi.decode(
            _vault.unlock(
                abi.encodeCall(
                    Router.addLiquidityHook,
                    AddLiquidityHookParams({
                        sender: msg.sender,
                        pool: pool,
                        maxAmountsIn: maxAmountsIn,
                        minBptAmountOut: exactBptAmountOut,
                        kind: AddLiquidityKind.PROPORTIONAL,
                        wethIsEth: wethIsEth,
                        userData: userData
                    })
                )
            ),
            (uint256[], uint256, bytes)
        );
    }

    /// @inheritdoc IRouter
    function addLiquidityUnbalanced(
        address pool,
        uint256[] memory exactAmountsIn,
        uint256 minBptAmountOut,
        bool wethIsEth,
        bytes memory userData
    ) external payable saveSender(msg.sender) returns (uint256 bptAmountOut) {
        (, bptAmountOut, ) = abi.decode(
            _vault.unlock(
                abi.encodeCall(
                    Router.addLiquidityHook,
                    AddLiquidityHookParams({
                        sender: msg.sender,
                        pool: pool,
                        maxAmountsIn: exactAmountsIn,
                        minBptAmountOut: minBptAmountOut,
                        kind: AddLiquidityKind.UNBALANCED,
                        wethIsEth: wethIsEth,
                        userData: userData
                    })
                )
            ),
            (uint256[], uint256, bytes)
        );
    }

    /// @inheritdoc IRouter
    function addLiquiditySingleTokenExactOut(
        address pool,
        IERC20 tokenIn,
        uint256 maxAmountIn,
        uint256 exactBptAmountOut,
        bool wethIsEth,
        bytes memory userData
    ) external payable saveSender(msg.sender) returns (uint256 amountIn) {
        (uint256[] memory maxAmountsIn, uint256 tokenIndex) = _getSingleInputArrayAndTokenIndex(
            pool,
            tokenIn,
            maxAmountIn
        );

        (uint256[] memory amountsIn, , ) = abi.decode(
            _vault.unlock(
                abi.encodeCall(
                    Router.addLiquidityHook,
                    AddLiquidityHookParams({
                        sender: msg.sender,
                        pool: pool,
                        maxAmountsIn: maxAmountsIn,
                        minBptAmountOut: exactBptAmountOut,
                        kind: AddLiquidityKind.SINGLE_TOKEN_EXACT_OUT,
                        wethIsEth: wethIsEth,
                        userData: userData
                    })
                )
            ),
            (uint256[], uint256, bytes)
        );

        return amountsIn[tokenIndex];
    }

    /// @inheritdoc IRouter
    function donate(
        address pool,
        uint256[] memory amountsIn,
        bool wethIsEth,
        bytes memory userData
    ) external payable saveSender(msg.sender) {
        _vault.unlock(
            abi.encodeCall(
                Router.addLiquidityHook,
                AddLiquidityHookParams({
                    sender: msg.sender,
                    pool: pool,
                    maxAmountsIn: amountsIn,
                    minBptAmountOut: 0,
                    kind: AddLiquidityKind.DONATION,
                    wethIsEth: wethIsEth,
                    userData: userData
                })
            )
        );
    }

    /// @inheritdoc IRouter
    function addLiquidityCustom(
        address pool,
        uint256[] memory maxAmountsIn,
        uint256 minBptAmountOut,
        bool wethIsEth,
        bytes memory userData
    )
        external
        payable
        saveSender(msg.sender)
        returns (uint256[] memory amountsIn, uint256 bptAmountOut, bytes memory returnData)
    {
        return
            abi.decode(
                _vault.unlock(
                    abi.encodeCall(
                        Router.addLiquidityHook,
                        AddLiquidityHookParams({
                            sender: msg.sender,
                            pool: pool,
                            maxAmountsIn: maxAmountsIn,
                            minBptAmountOut: minBptAmountOut,
                            kind: AddLiquidityKind.CUSTOM,
                            wethIsEth: wethIsEth,
                            userData: userData
                        })
                    )
                ),
                (uint256[], uint256, bytes)
            );
    }

    /**
     * @notice Hook for adding liquidity.
     * @dev Can only be called by the Vault.
     * @param params Add liquidity parameters (see IRouter for struct definition)
     * @return amountsIn Actual amounts in required for the join
     * @return bptAmountOut BPT amount minted in exchange for the input tokens
     * @return returnData Arbitrary data with encoded response from the pool
     */
    function addLiquidityHook(
        AddLiquidityHookParams calldata params
    )
        external
        nonReentrant
        onlyVault
        returns (uint256[] memory amountsIn, uint256 bptAmountOut, bytes memory returnData)
    {
        (amountsIn, bptAmountOut, returnData) = _vault.addLiquidity(
            AddLiquidityParams({
                pool: params.pool,
                to: params.sender,
                maxAmountsIn: params.maxAmountsIn,
                minBptAmountOut: params.minBptAmountOut,
                kind: params.kind,
                userData: params.userData
            })
        );

        // maxAmountsIn length is checked against tokens length at the Vault.
        IERC20[] memory tokens = _vault.getPoolTokens(params.pool);

        for (uint256 i = 0; i < tokens.length; ++i) {
            IERC20 token = tokens[i];
            uint256 amountIn = amountsIn[i];

            if (amountIn == 0) {
                continue;
            }

            // There can be only one WETH token in the pool.
            if (params.wethIsEth && address(token) == address(_weth)) {
                _weth.wrapEthAndSettle(_vault, amountIn);
            } else {
                // Any value over MAX_UINT128 would revert above in `addLiquidity`, so this SafeCast shouldn't be
                // necessary. Done out of an abundance of caution.
                // @todo revert this in the future
                // _permit2.transferFrom(params.sender, address(_vault), amountIn.toUint160(), address(token));
                if (_initOnColl) {
                    IERC20(token).transfer(address(_vault), amountIn.toUint160());
                } else {
                    IERC20(token).transferFrom(params.sender, address(_vault), amountIn.toUint160());
                }
                _vault.settle(token, amountIn);
            }
        }

        // Send remaining ETH to the user.
        _returnEth(params.sender);
    }

    /***************************************************************************
                                 Remove Liquidity
    ***************************************************************************/

    /// @inheritdoc IRouter
    function removeLiquidityProportional(
        address pool,
        uint256 exactBptAmountIn,
        uint256[] memory minAmountsOut,
        bool wethIsEth,
        bytes memory userData
    ) external payable saveSender(msg.sender) returns (uint256[] memory amountsOut) {
        (, amountsOut, ) = abi.decode(
            _vault.unlock(
                abi.encodeCall(
                    Router.removeLiquidityHook,
                    RemoveLiquidityHookParams({
                        sender: msg.sender,
                        pool: pool,
                        minAmountsOut: minAmountsOut,
                        maxBptAmountIn: exactBptAmountIn,
                        kind: RemoveLiquidityKind.PROPORTIONAL,
                        wethIsEth: wethIsEth,
                        userData: userData
                    })
                )
            ),
            (uint256, uint256[], bytes)
        );
    }

    function removeLiquiditySingleTokenExactIn(
        address pool,
        uint256 exactBptAmountIn,
        uint256 chainId,
        uint256 minAmountOut,
        bool wethIsEth,
        bytes memory userData
    ) external saveSender(msg.sender) returns (uint256 amountOut) {
        IERC20 tokenOut = _vault.getPoolTokenByChainId(pool, chainId);
        if (address(tokenOut) == address(0)) {
            revert VaultNotRegisteredNetwork(pool, chainId);
        }

        (uint256[] memory minAmountsOut, uint256 tokenIndex) = _getSingleInputArrayAndTokenIndex(
            pool,
            tokenOut,
            minAmountOut
        );

        _toExternalNetwork = true;

        (, uint256[] memory amountsOut, ) = abi.decode(
            _vault.unlock(
                abi.encodeCall(
                    Router.removeLiquidityHook,
                    RemoveLiquidityHookParams({
                        sender: msg.sender,
                        pool: pool,
                        minAmountsOut: minAmountsOut,
                        maxBptAmountIn: exactBptAmountIn,
                        kind: RemoveLiquidityKind.SINGLE_TOKEN_EXACT_IN,
                        wethIsEth: wethIsEth,
                        userData: userData
                    })
                )
            ),
            (uint256, uint256[], bytes)
        );

        amountOut = amountsOut[tokenIndex];

        _toExternalNetwork = false;
    }

    /// @inheritdoc IRouter
    function removeLiquiditySingleTokenExactIn(
        address pool,
        uint256 exactBptAmountIn,
        IERC20 tokenOut,
        uint256 minAmountOut,
        bool wethIsEth,
        bytes memory userData
    ) external payable saveSender(msg.sender) returns (uint256 amountOut) {
        (uint256[] memory minAmountsOut, uint256 tokenIndex) = _getSingleInputArrayAndTokenIndex(
            pool,
            tokenOut,
            minAmountOut
        );

        (, uint256[] memory amountsOut, ) = abi.decode(
            _vault.unlock(
                abi.encodeCall(
                    Router.removeLiquidityHook,
                    RemoveLiquidityHookParams({
                        sender: msg.sender,
                        pool: pool,
                        minAmountsOut: minAmountsOut,
                        maxBptAmountIn: exactBptAmountIn,
                        kind: RemoveLiquidityKind.SINGLE_TOKEN_EXACT_IN,
                        wethIsEth: wethIsEth,
                        userData: userData
                    })
                )
            ),
            (uint256, uint256[], bytes)
        );

        return amountsOut[tokenIndex];
    }

    /// @inheritdoc IRouter
    function removeLiquiditySingleTokenExactOut(
        address pool,
        uint256 maxBptAmountIn,
        IERC20 tokenOut,
        uint256 exactAmountOut,
        bool wethIsEth,
        bytes memory userData
    ) external payable saveSender(msg.sender) returns (uint256 bptAmountIn) {
        (uint256[] memory minAmountsOut, ) = _getSingleInputArrayAndTokenIndex(pool, tokenOut, exactAmountOut);

        (bptAmountIn, , ) = abi.decode(
            _vault.unlock(
                abi.encodeCall(
                    Router.removeLiquidityHook,
                    RemoveLiquidityHookParams({
                        sender: msg.sender,
                        pool: pool,
                        minAmountsOut: minAmountsOut,
                        maxBptAmountIn: maxBptAmountIn,
                        kind: RemoveLiquidityKind.SINGLE_TOKEN_EXACT_OUT,
                        wethIsEth: wethIsEth,
                        userData: userData
                    })
                )
            ),
            (uint256, uint256[], bytes)
        );

        return bptAmountIn;
    }

    /// @inheritdoc IRouter
    function removeLiquidityCustom(
        address pool,
        uint256 maxBptAmountIn,
        uint256[] memory minAmountsOut,
        bool wethIsEth,
        bytes memory userData
    )
        external
        payable
        saveSender(msg.sender)
        returns (uint256 bptAmountIn, uint256[] memory amountsOut, bytes memory returnData)
    {
        return
            abi.decode(
                _vault.unlock(
                    abi.encodeCall(
                        Router.removeLiquidityHook,
                        RemoveLiquidityHookParams({
                            sender: msg.sender,
                            pool: pool,
                            minAmountsOut: minAmountsOut,
                            maxBptAmountIn: maxBptAmountIn,
                            kind: RemoveLiquidityKind.CUSTOM,
                            wethIsEth: wethIsEth,
                            userData: userData
                        })
                    )
                ),
                (uint256, uint256[], bytes)
            );
    }

    /// @inheritdoc IRouter
    function removeLiquidityRecovery(
        address pool,
        uint256 exactBptAmountIn,
        uint256[] memory minAmountsOut
    ) external payable returns (uint256[] memory amountsOut) {
        amountsOut = abi.decode(
            _vault.unlock(
                abi.encodeCall(Router.removeLiquidityRecoveryHook, (pool, msg.sender, exactBptAmountIn, minAmountsOut))
            ),
            (uint256[])
        );
    }

    /**
     * @notice Hook for removing liquidity.
     * @dev Can only be called by the Vault.
     * @param params Remove liquidity parameters (see IRouter for struct definition)
     * @return bptAmountIn BPT amount burned for the output tokens
     * @return amountsOut Actual token amounts transferred in exchange for the BPT
     * @return returnData Arbitrary (optional) data with an encoded response from the pool
     */
    function removeLiquidityHook(
        RemoveLiquidityHookParams calldata params
    )
        external
        nonReentrant
        onlyVault
        returns (uint256 bptAmountIn, uint256[] memory amountsOut, bytes memory returnData)
    {
        (bptAmountIn, amountsOut, returnData) = _vault.removeLiquidity(
            RemoveLiquidityParams({
                pool: params.pool,
                from: params.sender,
                maxBptAmountIn: params.maxBptAmountIn,
                minAmountsOut: params.minAmountsOut,
                kind: params.kind,
                userData: params.userData
            })
        );

        // minAmountsOut length is checked against tokens length at the Vault.
        IERC20[] memory tokens = _vault.getPoolTokens(params.pool);

        for (uint256 i = 0; i < tokens.length; ++i) {
            uint256 amountOut = amountsOut[i];
            if (amountOut == 0) {
                continue;
            }

            IERC20 token = tokens[i];

            // There can be only one WETH token in the pool.
            if (params.wethIsEth && address(token) == address(_weth)) {
                // @todo temporarily solution
                // _weth.unwrapWethAndTransferToSender(_vault, params.sender, amountOut);
            } else {
                address recipient = params.sender;

                if (_toExternalNetwork) recipient = address(this);

                // Transfer the token to the sender or Router (amountOut).
                _vault.sendTo(token, recipient, amountOut);

                if (_toExternalNetwork) {
                    (uint256 updateAmountOut, address gasZRC20, uint256 gasFee) = _handleGasAndSwap(
                        amountOut,
                        address(token)
                    );

                    _withdraw(params.sender, address(token), updateAmountOut, gasZRC20, gasFee);
                }
            }
        }

        _returnEth(params.sender);
    }

    /**
     * @notice Hook for removing liquidity in Recovery Mode.
     * @dev Can only be called by the Vault, when the pool is in Recovery Mode.
     * @param pool Address of the liquidity pool
     * @param sender Account originating the remove liquidity operation
     * @param exactBptAmountIn BPT amount burned for the output tokens
     * @param minAmountsOut Minimum amounts of tokens to be received, sorted in token registration order
     * @return amountsOut Actual token amounts transferred in exchange for the BPT
     */
    function removeLiquidityRecoveryHook(
        address pool,
        address sender,
        uint256 exactBptAmountIn,
        uint256[] memory minAmountsOut
    ) external nonReentrant onlyVault returns (uint256[] memory amountsOut) {
        amountsOut = _vault.removeLiquidityRecovery(pool, sender, exactBptAmountIn, minAmountsOut);

        IERC20[] memory tokens = _vault.getPoolTokens(pool);

        for (uint256 i = 0; i < tokens.length; ++i) {
            uint256 amountOut = amountsOut[i];
            if (amountOut > 0) {
                // Transfer the token to the sender (amountOut).
                _vault.sendTo(tokens[i], sender, amountOut);
            }
        }

        _returnEth(sender);
    }

    /***************************************************************************
                                       Swaps
    ***************************************************************************/

    /// @inheritdoc IRouter
    function swapSingleTokenExactIn(
        address pool,
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 exactAmountIn,
        uint256 minAmountOut,
        uint256 deadline,
        bool wethIsEth,
        bytes calldata userData
    ) external payable saveSender(msg.sender) returns (uint256) {
        return
            abi.decode(
                _vault.unlock(
                    abi.encodeCall(
                        Router.swapSingleTokenHook,
                        SwapSingleTokenHookParams({
                            sender: msg.sender,
                            kind: SwapKind.EXACT_IN,
                            pool: pool,
                            tokenIn: tokenIn,
                            tokenOut: tokenOut,
                            amountGiven: exactAmountIn,
                            limit: minAmountOut,
                            deadline: deadline,
                            wethIsEth: wethIsEth,
                            userData: userData
                        })
                    )
                ),
                (uint256)
            );
    }

    /// @inheritdoc IRouter
    function swapSingleTokenExactOut(
        address pool,
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 exactAmountOut,
        uint256 maxAmountIn,
        uint256 deadline,
        bool wethIsEth,
        bytes calldata userData
    ) external payable saveSender(msg.sender) returns (uint256) {
        return
            abi.decode(
                _vault.unlock(
                    abi.encodeCall(
                        Router.swapSingleTokenHook,
                        SwapSingleTokenHookParams({
                            sender: msg.sender,
                            kind: SwapKind.EXACT_OUT,
                            pool: pool,
                            tokenIn: tokenIn,
                            tokenOut: tokenOut,
                            amountGiven: exactAmountOut,
                            limit: maxAmountIn,
                            deadline: deadline,
                            wethIsEth: wethIsEth,
                            userData: userData
                        })
                    )
                ),
                (uint256)
            );
    }

    /**
     * @notice Hook for swaps.
     * @dev Can only be called by the Vault. Also handles native ETH.
     * @param params Swap parameters (see IRouter for struct definition)
     * @return amountCalculated Token amount calculated by the pool math (e.g., amountOut for an exact in swap)
     */
    function swapSingleTokenHook(
        SwapSingleTokenHookParams calldata params
    ) external nonReentrant onlyVault returns (uint256) {
        (uint256 amountCalculated, uint256 amountIn, uint256 amountOut) = _swapHook(params);

        IERC20 tokenIn = params.tokenIn;

        _takeTokenIn(params.sender, tokenIn, amountIn, params.wethIsEth);
        _sendTokenOut(params.sender, params.tokenOut, amountOut, params.wethIsEth);

        if (tokenIn == _weth) {
            // Return the rest of ETH to sender
            _returnEth(params.sender);
        }

        return amountCalculated;
    }

    function _swapHook(
        SwapSingleTokenHookParams calldata params
    ) internal returns (uint256 amountCalculated, uint256 amountIn, uint256 amountOut) {
        // The deadline is timestamp-based: it should not be relied upon for sub-minute accuracy.
        // solhint-disable-next-line not-rely-on-time
        if (block.timestamp > params.deadline) {
            revert SwapDeadline();
        }

        (amountCalculated, amountIn, amountOut) = _vault.swap(
            VaultSwapParams({
                kind: params.kind,
                pool: params.pool,
                tokenIn: params.tokenIn,
                tokenOut: params.tokenOut,
                amountGivenRaw: params.amountGiven,
                limitRaw: params.limit,
                userData: params.userData
            })
        );
    }

    /*******************************************************************************
                                      Queries
    *******************************************************************************/

    /// @inheritdoc IRouter
    function queryAddLiquidityProportional(
        address pool,
        uint256 exactBptAmountOut,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256[] memory amountsIn) {
        (amountsIn, , ) = abi.decode(
            _vault.quote(
                abi.encodeCall(
                    Router.queryAddLiquidityHook,
                    AddLiquidityHookParams({
                        // We use the Router as a sender to simplify basic query functions,
                        // but it is possible to add liquidity to any recipient.
                        sender: address(this),
                        pool: pool,
                        maxAmountsIn: _maxTokenLimits(pool),
                        minBptAmountOut: exactBptAmountOut,
                        kind: AddLiquidityKind.PROPORTIONAL,
                        wethIsEth: false,
                        userData: userData
                    })
                )
            ),
            (uint256[], uint256, bytes)
        );
    }

    /// @inheritdoc IRouter
    function queryAddLiquidityUnbalanced(
        address pool,
        uint256[] memory exactAmountsIn,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256 bptAmountOut) {
        (, bptAmountOut, ) = abi.decode(
            _vault.quote(
                abi.encodeCall(
                    Router.queryAddLiquidityHook,
                    AddLiquidityHookParams({
                        // We use the Router as a sender to simplify basic query functions,
                        // but it is possible to add liquidity to any recipient.
                        sender: address(this),
                        pool: pool,
                        maxAmountsIn: exactAmountsIn,
                        minBptAmountOut: 0,
                        kind: AddLiquidityKind.UNBALANCED,
                        wethIsEth: false,
                        userData: userData
                    })
                )
            ),
            (uint256[], uint256, bytes)
        );
    }

    /// @inheritdoc IRouter
    function queryAddLiquiditySingleTokenExactOut(
        address pool,
        IERC20 tokenIn,
        uint256 exactBptAmountOut,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256 amountIn) {
        (uint256[] memory maxAmountsIn, uint256 tokenIndex) = _getSingleInputArrayAndTokenIndex(
            pool,
            tokenIn,
            _MAX_AMOUNT
        );

        (uint256[] memory amountsIn, , ) = abi.decode(
            _vault.quote(
                abi.encodeCall(
                    Router.queryAddLiquidityHook,
                    AddLiquidityHookParams({
                        // We use the Router as a sender to simplify basic query functions,
                        // but it is possible to add liquidity to any recipient.
                        sender: address(this),
                        pool: pool,
                        maxAmountsIn: maxAmountsIn,
                        minBptAmountOut: exactBptAmountOut,
                        kind: AddLiquidityKind.SINGLE_TOKEN_EXACT_OUT,
                        wethIsEth: false,
                        userData: userData
                    })
                )
            ),
            (uint256[], uint256, bytes)
        );

        return amountsIn[tokenIndex];
    }

    /// @inheritdoc IRouter
    function queryAddLiquidityCustom(
        address pool,
        uint256[] memory maxAmountsIn,
        uint256 minBptAmountOut,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256[] memory amountsIn, uint256 bptAmountOut, bytes memory returnData) {
        return
            abi.decode(
                _vault.quote(
                    abi.encodeCall(
                        Router.queryAddLiquidityHook,
                        AddLiquidityHookParams({
                            // We use the Router as a sender to simplify basic query functions,
                            // but it is possible to add liquidity to any recipient.
                            sender: address(this),
                            pool: pool,
                            maxAmountsIn: maxAmountsIn,
                            minBptAmountOut: minBptAmountOut,
                            kind: AddLiquidityKind.CUSTOM,
                            wethIsEth: false,
                            userData: userData
                        })
                    )
                ),
                (uint256[], uint256, bytes)
            );
    }

    /**
     * @notice Hook for add liquidity queries.
     * @dev Can only be called by the Vault.
     * @param params Add liquidity parameters (see IRouter for struct definition)
     * @return amountsIn Actual token amounts in required as inputs
     * @return bptAmountOut Expected pool tokens to be minted
     * @return returnData Arbitrary (optional) data with an encoded response from the pool
     */
    function queryAddLiquidityHook(
        AddLiquidityHookParams calldata params
    ) external onlyVault returns (uint256[] memory amountsIn, uint256 bptAmountOut, bytes memory returnData) {
        (amountsIn, bptAmountOut, returnData) = _vault.addLiquidity(
            AddLiquidityParams({
                pool: params.pool,
                to: params.sender,
                maxAmountsIn: params.maxAmountsIn,
                minBptAmountOut: params.minBptAmountOut,
                kind: params.kind,
                userData: params.userData
            })
        );
    }

    /// @inheritdoc IRouter
    function queryRemoveLiquidityProportional(
        address pool,
        uint256 exactBptAmountIn,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256[] memory amountsOut) {
        uint256[] memory minAmountsOut = new uint256[](_vault.getPoolTokens(pool).length);
        (, amountsOut, ) = abi.decode(
            _vault.quote(
                abi.encodeCall(
                    Router.queryRemoveLiquidityHook,
                    RemoveLiquidityHookParams({
                        // We use the Router as a sender to simplify basic query functions,
                        // but it is possible to remove liquidity from any sender.
                        sender: address(this),
                        pool: pool,
                        minAmountsOut: minAmountsOut,
                        maxBptAmountIn: exactBptAmountIn,
                        kind: RemoveLiquidityKind.PROPORTIONAL,
                        wethIsEth: false,
                        userData: userData
                    })
                )
            ),
            (uint256, uint256[], bytes)
        );
    }

    /// @inheritdoc IRouter
    function queryRemoveLiquiditySingleTokenExactIn(
        address pool,
        uint256 exactBptAmountIn,
        IERC20 tokenOut,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256 amountOut) {
        // We cannot use 0 as min amount out, as this value is used to figure out the token index.
        (uint256[] memory minAmountsOut, uint256 tokenIndex) = _getSingleInputArrayAndTokenIndex(pool, tokenOut, 1);

        (, uint256[] memory amountsOut, ) = abi.decode(
            _vault.quote(
                abi.encodeCall(
                    Router.queryRemoveLiquidityHook,
                    RemoveLiquidityHookParams({
                        // We use the Router as a sender to simplify basic query functions,
                        // but it is possible to remove liquidity from any sender.
                        sender: address(this),
                        pool: pool,
                        minAmountsOut: minAmountsOut,
                        maxBptAmountIn: exactBptAmountIn,
                        kind: RemoveLiquidityKind.SINGLE_TOKEN_EXACT_IN,
                        wethIsEth: false,
                        userData: userData
                    })
                )
            ),
            (uint256, uint256[], bytes)
        );

        return amountsOut[tokenIndex];
    }

    /// @inheritdoc IRouter
    function queryRemoveLiquiditySingleTokenExactOut(
        address pool,
        IERC20 tokenOut,
        uint256 exactAmountOut,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256 bptAmountIn) {
        (uint256[] memory minAmountsOut, ) = _getSingleInputArrayAndTokenIndex(pool, tokenOut, exactAmountOut);

        (bptAmountIn, , ) = abi.decode(
            _vault.quote(
                abi.encodeCall(
                    Router.queryRemoveLiquidityHook,
                    RemoveLiquidityHookParams({
                        // We use the Router as a sender to simplify basic query functions,
                        // but it is possible to remove liquidity from any sender.
                        sender: address(this),
                        pool: pool,
                        minAmountsOut: minAmountsOut,
                        maxBptAmountIn: _MAX_AMOUNT,
                        kind: RemoveLiquidityKind.SINGLE_TOKEN_EXACT_OUT,
                        wethIsEth: false,
                        userData: userData
                    })
                )
            ),
            (uint256, uint256[], bytes)
        );

        return bptAmountIn;
    }

    /// @inheritdoc IRouter
    function queryRemoveLiquidityCustom(
        address pool,
        uint256 maxBptAmountIn,
        uint256[] memory minAmountsOut,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256 bptAmountIn, uint256[] memory amountsOut, bytes memory returnData) {
        return
            abi.decode(
                _vault.quote(
                    abi.encodeCall(
                        Router.queryRemoveLiquidityHook,
                        RemoveLiquidityHookParams({
                            // We use the Router as a sender to simplify basic query functions,
                            // but it is possible to remove liquidity from any sender.
                            sender: address(this),
                            pool: pool,
                            minAmountsOut: minAmountsOut,
                            maxBptAmountIn: maxBptAmountIn,
                            kind: RemoveLiquidityKind.CUSTOM,
                            wethIsEth: false,
                            userData: userData
                        })
                    )
                ),
                (uint256, uint256[], bytes)
            );
    }

    /// @inheritdoc IRouter
    function queryRemoveLiquidityRecovery(
        address pool,
        uint256 exactBptAmountIn
    ) external returns (uint256[] memory amountsOut) {
        return
            abi.decode(
                _vault.quote(
                    abi.encodeCall(Router.queryRemoveLiquidityRecoveryHook, (pool, address(this), exactBptAmountIn))
                ),
                (uint256[])
            );
    }

    /**
     * @notice Hook for remove liquidity queries.
     * @dev Can only be called by the Vault.
     * @param params Remove liquidity parameters (see IRouter for struct definition)
     * @return bptAmountIn Pool token amount to be burned for the output tokens
     * @return amountsOut Expected token amounts to be transferred to the sender
     * @return returnData Arbitrary (optional) data with an encoded response from the pool
     */
    function queryRemoveLiquidityHook(
        RemoveLiquidityHookParams calldata params
    ) external onlyVault returns (uint256 bptAmountIn, uint256[] memory amountsOut, bytes memory returnData) {
        return
            _vault.removeLiquidity(
                RemoveLiquidityParams({
                    pool: params.pool,
                    from: params.sender,
                    maxBptAmountIn: params.maxBptAmountIn,
                    minAmountsOut: params.minAmountsOut,
                    kind: params.kind,
                    userData: params.userData
                })
            );
    }

    /**
     * @notice Hook for remove liquidity queries.
     * @dev Can only be called by the Vault.
     * @param pool The liquidity pool
     * @param sender Account originating the remove liquidity operation
     * @param exactBptAmountIn Pool token amount to be burned for the output tokens
     * @return amountsOut Expected token amounts to be transferred to the sender
     */
    function queryRemoveLiquidityRecoveryHook(
        address pool,
        address sender,
        uint256 exactBptAmountIn
    ) external onlyVault returns (uint256[] memory amountsOut) {
        uint256[] memory minAmountsOut = new uint256[](_vault.getPoolTokens(pool).length);
        return _vault.removeLiquidityRecovery(pool, sender, exactBptAmountIn, minAmountsOut);
    }

    /// @inheritdoc IRouter
    function querySwapSingleTokenExactIn(
        address pool,
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 exactAmountIn,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256 amountCalculated) {
        return
            abi.decode(
                _vault.quote(
                    abi.encodeCall(
                        Router.querySwapHook,
                        SwapSingleTokenHookParams({
                            sender: msg.sender,
                            kind: SwapKind.EXACT_IN,
                            pool: pool,
                            tokenIn: tokenIn,
                            tokenOut: tokenOut,
                            amountGiven: exactAmountIn,
                            limit: 0,
                            deadline: _MAX_AMOUNT,
                            wethIsEth: false,
                            userData: userData
                        })
                    )
                ),
                (uint256)
            );
    }

    /// @inheritdoc IRouter
    function querySwapSingleTokenExactOut(
        address pool,
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint256 exactAmountOut,
        address sender,
        bytes memory userData
    ) external saveSender(sender) returns (uint256 amountCalculated) {
        return
            abi.decode(
                _vault.quote(
                    abi.encodeCall(
                        Router.querySwapHook,
                        SwapSingleTokenHookParams({
                            sender: msg.sender,
                            kind: SwapKind.EXACT_OUT,
                            pool: pool,
                            tokenIn: tokenIn,
                            tokenOut: tokenOut,
                            amountGiven: exactAmountOut,
                            limit: _MAX_AMOUNT,
                            deadline: type(uint256).max,
                            wethIsEth: false,
                            userData: userData
                        })
                    )
                ),
                (uint256)
            );
    }

    /**
     * @notice Hook for swap queries.
     * @dev Can only be called by the Vault. Also handles native ETH.
     * @param params Swap parameters (see IRouter for struct definition)
     * @return amountCalculated Token amount calculated by the pool math (e.g., amountOut for an exact in swap)
     */
    function querySwapHook(
        SwapSingleTokenHookParams calldata params
    ) external nonReentrant onlyVault returns (uint256) {
        (uint256 amountCalculated, , ) = _swapHook(params);

        return amountCalculated;
    }
}
