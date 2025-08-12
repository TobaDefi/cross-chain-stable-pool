# Solidity API

## Router

Entrypoint for swaps, liquidity operations, and corresponding queries.

_The external API functions unlock the Vault, which calls back into the corresponding hook functions.
These interact with the Vault, transfer tokens, settle accounting, and handle wrapping and unwrapping ETH._

### GATEWAY

```solidity
contract IGatewayZEVM GATEWAY
```

The Gateway contract address for ZetaChain Testnet

### UNISWAP_ROUTER

```solidity
address UNISWAP_ROUTER
```

The Uniswap V2 Router contract address for ZetaChain Testnet

_This router is used to swap tokens in the Universal Token Sale._

### GAS_LIMIT

```solidity
uint256 GAS_LIMIT
```

The gas limit for the onRevert function.

### _initOnColl

```solidity
bool _initOnColl
```

### _toExternalNetwork

```solidity
bool _toExternalNetwork
```

### NotGateway

```solidity
error NotGateway()
```

Error thrown when the caller is not the Gateway contract.

### ApprovalFailed

```solidity
error ApprovalFailed(address token, uint256 amount)
```

Error thrown when the approval of a token transfer fails.

### InsufficientWithdrawGasFeeAmount

```solidity
error InsufficientWithdrawGasFeeAmount()
```

Error thrown when the amount is insufficient to cover the gas fee for withdrawal to the external network.

### VaultNotRegisteredNetwork

```solidity
error VaultNotRegisteredNetwork(address pool, uint256 chainId)
```

### onlyGateway

```solidity
modifier onlyGateway()
```

Modifier that restricts access to the Gateway contract.

### constructor

```solidity
constructor(contract IVault vault, contract IWETH weth, string routerVersion) public
```

### Message

```solidity
struct Message {
  address pool;
  uint256 minBptAmountOut;
}
```

### onCall

```solidity
function onCall(struct MessageContext context, address zrc20, uint256 amount, bytes message) external
```

### _withdraw

```solidity
function _withdraw(address sender, address targetToken, uint256 out, address gasZRC20, uint256 gasFee) internal
```

Transfer tokens to the recipient on ZetaChain or withdraw to a connected chain

### onRevert

```solidity
function onRevert(struct RevertContext context) external
```

### onAbort

```solidity
function onAbort(struct RevertContext context) external
```

### _handleGasAndSwap

```solidity
function _handleGasAndSwap(uint256 amount, address targetToken) internal returns (uint256 amountOut, address gasZRC20, uint256 gasFee)
```

Swaps enough tokens to pay gas fees, then swaps the remainder to the target token

### initialize

```solidity
function initialize(address pool, contract IERC20[] tokens, uint256[] exactAmountsIn, uint256 minBptAmountOut, bool wethIsEth, bytes userData) external payable returns (uint256 bptAmountOut)
```

Initialize a liquidity pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| tokens | contract IERC20[] | Pool tokens, in token registration order |
| exactAmountsIn | uint256[] | Exact amounts of tokens to be added, sorted in token registration order |
| minBptAmountOut | uint256 | Minimum amount of pool tokens to be received |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to add initial liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountOut | uint256 | Actual amount of pool tokens minted in exchange for initial liquidity |

### initializeHook

```solidity
function initializeHook(struct IRouter.InitializeHookParams params) external returns (uint256 bptAmountOut)
```

Hook for initialization.

_Can only be called by the Vault._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct IRouter.InitializeHookParams | Initialization parameters (see IRouter for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountOut | uint256 | BPT amount minted in exchange for the input tokens |

### Todo

```solidity
error Todo()
```

### addTokenToPool

```solidity
function addTokenToPool(address pool, struct TokenConfig tokenConfig, uint256 exactAmountIn) external returns (uint256 bptAmountOut)
```

### addTokenToPoolHook

```solidity
function addTokenToPoolHook(struct IRouter.AddTokenToPoolHookParams params) external returns (uint256 bptAmountOut, uint256 tokenIndex)
```

### addLiquidityProportional

```solidity
function addLiquidityProportional(address pool, uint256[] maxAmountsIn, uint256 exactBptAmountOut, bool wethIsEth, bytes userData) external payable returns (uint256[] amountsIn)
```

Adds liquidity to a pool with proportional token amounts, receiving an exact amount of pool tokens.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| maxAmountsIn | uint256[] | Maximum amounts of tokens to be added, sorted in token registration order |
| exactBptAmountOut | uint256 | Exact amount of pool tokens to be received |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to add liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsIn | uint256[] | Actual amounts of tokens added, sorted in token registration order |

### addLiquidityUnbalanced

```solidity
function addLiquidityUnbalanced(address pool, uint256[] exactAmountsIn, uint256 minBptAmountOut, bool wethIsEth, bytes userData) external payable returns (uint256 bptAmountOut)
```

Adds liquidity to a pool with arbitrary token amounts.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| exactAmountsIn | uint256[] | Exact amounts of tokens to be added, sorted in token registration order |
| minBptAmountOut | uint256 | Minimum amount of pool tokens to be received |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to add liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountOut | uint256 | Actual amount of pool tokens received |

### addLiquiditySingleTokenExactOut

```solidity
function addLiquiditySingleTokenExactOut(address pool, contract IERC20 tokenIn, uint256 maxAmountIn, uint256 exactBptAmountOut, bool wethIsEth, bytes userData) external payable returns (uint256 amountIn)
```

Adds liquidity to a pool in a single token, receiving an exact amount of pool tokens.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| tokenIn | contract IERC20 | Token used to add liquidity |
| maxAmountIn | uint256 | Maximum amount of tokens to be added |
| exactBptAmountOut | uint256 | Exact amount of pool tokens to be received |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to add liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountIn | uint256 | Actual amount of tokens added |

### donate

```solidity
function donate(address pool, uint256[] amountsIn, bool wethIsEth, bytes userData) external payable
```

Adds liquidity to a pool by donating the amounts in (no BPT out).

_To support donation, the pool config `enableDonation` flag must be set to true._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| amountsIn | uint256[] | Amounts of tokens to be donated, sorted in token registration order |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to donate liquidity |

### addLiquidityCustom

```solidity
function addLiquidityCustom(address pool, uint256[] maxAmountsIn, uint256 minBptAmountOut, bool wethIsEth, bytes userData) external payable returns (uint256[] amountsIn, uint256 bptAmountOut, bytes returnData)
```

Adds liquidity to a pool with a custom request.

_The given maximum and minimum amounts given may be interpreted as exact depending on the pool type.
In any case the caller can expect them to be hard boundaries for the request._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| maxAmountsIn | uint256[] | Maximum amounts of tokens to be added, sorted in token registration order |
| minBptAmountOut | uint256 | Minimum amount of pool tokens to be received |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to add liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsIn | uint256[] | Actual amounts of tokens added, sorted in token registration order |
| bptAmountOut | uint256 | Actual amount of pool tokens received |
| returnData | bytes | Arbitrary (optional) data with an encoded response from the pool |

### addLiquidityHook

```solidity
function addLiquidityHook(struct IRouterCommon.AddLiquidityHookParams params) external returns (uint256[] amountsIn, uint256 bptAmountOut, bytes returnData)
```

Hook for adding liquidity.

_Can only be called by the Vault._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct IRouterCommon.AddLiquidityHookParams | Add liquidity parameters (see IRouter for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsIn | uint256[] | Actual amounts in required for the join |
| bptAmountOut | uint256 | BPT amount minted in exchange for the input tokens |
| returnData | bytes | Arbitrary data with encoded response from the pool |

### removeLiquidityProportional

```solidity
function removeLiquidityProportional(address pool, uint256 exactBptAmountIn, uint256[] minAmountsOut, bool wethIsEth, bytes userData) external payable returns (uint256[] amountsOut)
```

Removes liquidity with proportional token amounts from a pool, burning an exact pool token amount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| exactBptAmountIn | uint256 | Exact amount of pool tokens provided |
| minAmountsOut | uint256[] | Minimum amounts of tokens to be received, sorted in token registration order |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to remove liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsOut | uint256[] | Actual amounts of tokens received, sorted in token registration order |

### removeLiquiditySingleTokenExactIn

```solidity
function removeLiquiditySingleTokenExactIn(address pool, uint256 exactBptAmountIn, uint256 chainId, uint256 minAmountOut, bool wethIsEth, bytes userData) external returns (uint256 amountOut)
```

### removeLiquiditySingleTokenExactIn

```solidity
function removeLiquiditySingleTokenExactIn(address pool, uint256 exactBptAmountIn, contract IERC20 tokenOut, uint256 minAmountOut, bool wethIsEth, bytes userData) external payable returns (uint256 amountOut)
```

Removes liquidity from a pool via a single token, burning an exact pool token amount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| exactBptAmountIn | uint256 | Exact amount of pool tokens provided |
| tokenOut | contract IERC20 | Token used to remove liquidity |
| minAmountOut | uint256 | Minimum amount of tokens to be received |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to remove liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountOut | uint256 | Actual amount of tokens received |

### removeLiquiditySingleTokenExactOut

```solidity
function removeLiquiditySingleTokenExactOut(address pool, uint256 maxBptAmountIn, contract IERC20 tokenOut, uint256 exactAmountOut, bool wethIsEth, bytes userData) external payable returns (uint256 bptAmountIn)
```

Removes liquidity from a pool via a single token, specifying the exact amount of tokens to receive.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| maxBptAmountIn | uint256 | Maximum amount of pool tokens provided |
| tokenOut | contract IERC20 | Token used to remove liquidity |
| exactAmountOut | uint256 | Exact amount of tokens to be received |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to remove liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountIn | uint256 | Actual amount of pool tokens burned |

### removeLiquidityCustom

```solidity
function removeLiquidityCustom(address pool, uint256 maxBptAmountIn, uint256[] minAmountsOut, bool wethIsEth, bytes userData) external payable returns (uint256 bptAmountIn, uint256[] amountsOut, bytes returnData)
```

Removes liquidity from a pool with a custom request.

_The given maximum and minimum amounts given may be interpreted as exact depending on the pool type.
In any case the caller can expect them to be hard boundaries for the request._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| maxBptAmountIn | uint256 | Maximum amount of pool tokens provided |
| minAmountsOut | uint256[] | Minimum amounts of tokens to be received, sorted in token registration order |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the request to remove liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountIn | uint256 | Actual amount of pool tokens burned |
| amountsOut | uint256[] | Actual amounts of tokens received, sorted in token registration order |
| returnData | bytes | Arbitrary (optional) data with an encoded response from the pool |

### removeLiquidityRecovery

```solidity
function removeLiquidityRecovery(address pool, uint256 exactBptAmountIn, uint256[] minAmountsOut) external payable returns (uint256[] amountsOut)
```

Removes liquidity proportionally, burning an exact pool token amount. Only available in Recovery Mode.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| exactBptAmountIn | uint256 | Exact amount of pool tokens provided |
| minAmountsOut | uint256[] | Minimum amounts of tokens to be received, sorted in token registration order |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsOut | uint256[] | Actual amounts of tokens received, sorted in token registration order |

### removeLiquidityHook

```solidity
function removeLiquidityHook(struct IRouterCommon.RemoveLiquidityHookParams params) external returns (uint256 bptAmountIn, uint256[] amountsOut, bytes returnData)
```

Hook for removing liquidity.

_Can only be called by the Vault._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct IRouterCommon.RemoveLiquidityHookParams | Remove liquidity parameters (see IRouter for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountIn | uint256 | BPT amount burned for the output tokens |
| amountsOut | uint256[] | Actual token amounts transferred in exchange for the BPT |
| returnData | bytes | Arbitrary (optional) data with an encoded response from the pool |

### removeLiquidityRecoveryHook

```solidity
function removeLiquidityRecoveryHook(address pool, address sender, uint256 exactBptAmountIn, uint256[] minAmountsOut) external returns (uint256[] amountsOut)
```

Hook for removing liquidity in Recovery Mode.

_Can only be called by the Vault, when the pool is in Recovery Mode._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| sender | address | Account originating the remove liquidity operation |
| exactBptAmountIn | uint256 | BPT amount burned for the output tokens |
| minAmountsOut | uint256[] | Minimum amounts of tokens to be received, sorted in token registration order |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsOut | uint256[] | Actual token amounts transferred in exchange for the BPT |

### swapSingleTokenExactIn

```solidity
function swapSingleTokenExactIn(address pool, contract IERC20 tokenIn, contract IERC20 tokenOut, uint256 exactAmountIn, uint256 minAmountOut, uint256 deadline, bool wethIsEth, bytes userData) external payable returns (uint256)
```

Executes a swap operation specifying an exact input token amount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| tokenIn | contract IERC20 | Token to be swapped from |
| tokenOut | contract IERC20 | Token to be swapped to |
| exactAmountIn | uint256 | Exact amounts of input tokens to send |
| minAmountOut | uint256 | Minimum amount of tokens to be received |
| deadline | uint256 | Deadline for the swap, after which it will revert |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the swap request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### swapSingleTokenExactOut

```solidity
function swapSingleTokenExactOut(address pool, contract IERC20 tokenIn, contract IERC20 tokenOut, uint256 exactAmountOut, uint256 maxAmountIn, uint256 deadline, bool wethIsEth, bytes userData) external payable returns (uint256)
```

Executes a swap operation specifying an exact output token amount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| tokenIn | contract IERC20 | Token to be swapped from |
| tokenOut | contract IERC20 | Token to be swapped to |
| exactAmountOut | uint256 | Exact amounts of input tokens to receive |
| maxAmountIn | uint256 | Maximum amount of tokens to be sent |
| deadline | uint256 | Deadline for the swap, after which it will revert |
| wethIsEth | bool | If true, incoming ETH will be wrapped to WETH and outgoing WETH will be unwrapped to ETH |
| userData | bytes | Additional (optional) data sent with the swap request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### swapSingleTokenHook

```solidity
function swapSingleTokenHook(struct IRouter.SwapSingleTokenHookParams params) external returns (uint256)
```

Hook for swaps.

_Can only be called by the Vault. Also handles native ETH._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct IRouter.SwapSingleTokenHookParams | Swap parameters (see IRouter for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | amountCalculated Token amount calculated by the pool math (e.g., amountOut for an exact in swap) |

### _swapHook

```solidity
function _swapHook(struct IRouter.SwapSingleTokenHookParams params) internal returns (uint256 amountCalculated, uint256 amountIn, uint256 amountOut)
```

### queryAddLiquidityProportional

```solidity
function queryAddLiquidityProportional(address pool, uint256 exactBptAmountOut, address sender, bytes userData) external returns (uint256[] amountsIn)
```

Queries an `addLiquidityProportional` operation without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| exactBptAmountOut | uint256 | Exact amount of pool tokens to be received |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsIn | uint256[] | Expected amounts of tokens to add, sorted in token registration order |

### queryAddLiquidityUnbalanced

```solidity
function queryAddLiquidityUnbalanced(address pool, uint256[] exactAmountsIn, address sender, bytes userData) external returns (uint256 bptAmountOut)
```

Queries an `addLiquidityUnbalanced` operation without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| exactAmountsIn | uint256[] | Exact amounts of tokens to be added, sorted in token registration order |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountOut | uint256 | Expected amount of pool tokens to receive |

### queryAddLiquiditySingleTokenExactOut

```solidity
function queryAddLiquiditySingleTokenExactOut(address pool, contract IERC20 tokenIn, uint256 exactBptAmountOut, address sender, bytes userData) external returns (uint256 amountIn)
```

Queries an `addLiquiditySingleTokenExactOut` operation without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| tokenIn | contract IERC20 | Token used to add liquidity |
| exactBptAmountOut | uint256 | Expected exact amount of pool tokens to receive |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountIn | uint256 | Expected amount of tokens to add |

### queryAddLiquidityCustom

```solidity
function queryAddLiquidityCustom(address pool, uint256[] maxAmountsIn, uint256 minBptAmountOut, address sender, bytes userData) external returns (uint256[] amountsIn, uint256 bptAmountOut, bytes returnData)
```

Queries an `addLiquidityCustom` operation without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| maxAmountsIn | uint256[] | Maximum amounts of tokens to be added, sorted in token registration order |
| minBptAmountOut | uint256 | Expected minimum amount of pool tokens to receive |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsIn | uint256[] | Expected amounts of tokens to add, sorted in token registration order |
| bptAmountOut | uint256 | Expected amount of pool tokens to receive |
| returnData | bytes | Arbitrary (optional) data with an encoded response from the pool |

### queryAddLiquidityHook

```solidity
function queryAddLiquidityHook(struct IRouterCommon.AddLiquidityHookParams params) external returns (uint256[] amountsIn, uint256 bptAmountOut, bytes returnData)
```

Hook for add liquidity queries.

_Can only be called by the Vault._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct IRouterCommon.AddLiquidityHookParams | Add liquidity parameters (see IRouter for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsIn | uint256[] | Actual token amounts in required as inputs |
| bptAmountOut | uint256 | Expected pool tokens to be minted |
| returnData | bytes | Arbitrary (optional) data with an encoded response from the pool |

### queryRemoveLiquidityProportional

```solidity
function queryRemoveLiquidityProportional(address pool, uint256 exactBptAmountIn, address sender, bytes userData) external returns (uint256[] amountsOut)
```

Queries a `removeLiquidityProportional` operation without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| exactBptAmountIn | uint256 | Exact amount of pool tokens provided for the query |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsOut | uint256[] | Expected amounts of tokens to receive, sorted in token registration order |

### queryRemoveLiquiditySingleTokenExactIn

```solidity
function queryRemoveLiquiditySingleTokenExactIn(address pool, uint256 exactBptAmountIn, contract IERC20 tokenOut, address sender, bytes userData) external returns (uint256 amountOut)
```

Queries a `removeLiquiditySingleTokenExactIn` operation without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| exactBptAmountIn | uint256 | Exact amount of pool tokens provided for the query |
| tokenOut | contract IERC20 | Token used to remove liquidity |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountOut | uint256 | Expected amount of tokens to receive |

### queryRemoveLiquiditySingleTokenExactOut

```solidity
function queryRemoveLiquiditySingleTokenExactOut(address pool, contract IERC20 tokenOut, uint256 exactAmountOut, address sender, bytes userData) external returns (uint256 bptAmountIn)
```

Queries a `removeLiquiditySingleTokenExactOut` operation without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| tokenOut | contract IERC20 | Token used to remove liquidity |
| exactAmountOut | uint256 | Expected exact amount of tokens to receive |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountIn | uint256 | Expected amount of pool tokens to burn |

### queryRemoveLiquidityCustom

```solidity
function queryRemoveLiquidityCustom(address pool, uint256 maxBptAmountIn, uint256[] minAmountsOut, address sender, bytes userData) external returns (uint256 bptAmountIn, uint256[] amountsOut, bytes returnData)
```

Queries a `removeLiquidityCustom` operation without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| maxBptAmountIn | uint256 | Maximum amount of pool tokens provided |
| minAmountsOut | uint256[] | Expected minimum amounts of tokens to receive, sorted in token registration order |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountIn | uint256 | Expected amount of pool tokens to burn |
| amountsOut | uint256[] | Expected amounts of tokens to receive, sorted in token registration order |
| returnData | bytes | Arbitrary (optional) data with an encoded response from the pool |

### queryRemoveLiquidityRecovery

```solidity
function queryRemoveLiquidityRecovery(address pool, uint256 exactBptAmountIn) external returns (uint256[] amountsOut)
```

Queries a `removeLiquidityRecovery` operation without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| exactBptAmountIn | uint256 | Exact amount of pool tokens provided for the query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsOut | uint256[] | Expected amounts of tokens to receive, sorted in token registration order |

### queryRemoveLiquidityHook

```solidity
function queryRemoveLiquidityHook(struct IRouterCommon.RemoveLiquidityHookParams params) external returns (uint256 bptAmountIn, uint256[] amountsOut, bytes returnData)
```

Hook for remove liquidity queries.

_Can only be called by the Vault._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct IRouterCommon.RemoveLiquidityHookParams | Remove liquidity parameters (see IRouter for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountIn | uint256 | Pool token amount to be burned for the output tokens |
| amountsOut | uint256[] | Expected token amounts to be transferred to the sender |
| returnData | bytes | Arbitrary (optional) data with an encoded response from the pool |

### queryRemoveLiquidityRecoveryHook

```solidity
function queryRemoveLiquidityRecoveryHook(address pool, address sender, uint256 exactBptAmountIn) external returns (uint256[] amountsOut)
```

Hook for remove liquidity queries.

_Can only be called by the Vault._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The liquidity pool |
| sender | address | Account originating the remove liquidity operation |
| exactBptAmountIn | uint256 | Pool token amount to be burned for the output tokens |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsOut | uint256[] | Expected token amounts to be transferred to the sender |

### querySwapSingleTokenExactIn

```solidity
function querySwapSingleTokenExactIn(address pool, contract IERC20 tokenIn, contract IERC20 tokenOut, uint256 exactAmountIn, address sender, bytes userData) external returns (uint256 amountCalculated)
```

Queries a swap operation specifying an exact input token amount without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| tokenIn | contract IERC20 | Token to be swapped from |
| tokenOut | contract IERC20 | Token to be swapped to |
| exactAmountIn | uint256 | Exact amounts of input tokens to send |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountCalculated | uint256 |  |

### querySwapSingleTokenExactOut

```solidity
function querySwapSingleTokenExactOut(address pool, contract IERC20 tokenIn, contract IERC20 tokenOut, uint256 exactAmountOut, address sender, bytes userData) external returns (uint256 amountCalculated)
```

Queries a swap operation specifying an exact output token amount without actually executing it.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the liquidity pool |
| tokenIn | contract IERC20 | Token to be swapped from |
| tokenOut | contract IERC20 | Token to be swapped to |
| exactAmountOut | uint256 | Exact amounts of input tokens to receive |
| sender | address | The sender passed to the operation. It can influence results (e.g., with user-dependent hooks) |
| userData | bytes | Additional (optional) data sent with the query request |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountCalculated | uint256 |  |

### querySwapHook

```solidity
function querySwapHook(struct IRouter.SwapSingleTokenHookParams params) external returns (uint256)
```

Hook for swap queries.

_Can only be called by the Vault. Also handles native ETH._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct IRouter.SwapSingleTokenHookParams | Swap parameters (see IRouter for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | amountCalculated Token amount calculated by the pool math (e.g., amountOut for an exact in swap) |

