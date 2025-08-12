# Solidity API

## Vault

### constructor

```solidity
constructor(contract IVaultExtension vaultExtension, contract IAuthorizer authorizer, contract IProtocolFeeController protocolFeeController) public
```

### transient

```solidity
modifier transient()
```

_This modifier is used for functions that temporarily modify the token deltas
of the Vault, but expect to revert or settle balances by the end of their execution.
It works by ensuring that the balances are properly settled by the time the last
operation is executed.

This is useful for functions like `unlock`, which perform arbitrary external calls:
we can keep track of temporary deltas changes, and make sure they are settled by the
time the external call is complete._

### unlock

```solidity
function unlock(bytes data) external returns (bytes result)
```

Creates a context for a sequence of operations (i.e., "unlocks" the Vault).

_Performs a callback on msg.sender with arguments provided in `data`. The Callback is `transient`,
meaning all balances for the caller have to be settled at the end._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Contains function signature and args to be passed to the msg.sender |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bytes | Resulting data from the call |

### settle

```solidity
function settle(contract IERC20 token, uint256 amountHint) external returns (uint256 credit)
```

Settles deltas for a token; must be successful for the current lock to be released.

_Protects the caller against leftover dust in the Vault for the token being settled. The caller
should know in advance how many tokens were paid to the Vault, so it can provide it as a hint to discard any
excess in the Vault balance.

If the given hint is equal to or higher than the difference in reserves, the difference in reserves is given as
credit to the caller. If it's higher, the caller sent fewer tokens than expected, so settlement would fail.

If the given hint is lower than the difference in reserves, the hint is given as credit to the caller.
In this case, the excess would be absorbed by the Vault (and reflected correctly in the reserves), but would
not affect settlement.

The credit supplied by the Vault can be calculated as `min(reserveDifference, amountHint)`, where the reserve
difference equals current balance of the token minus existing reserves of the token when the function is called._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | Address of the token |
| amountHint | uint256 | Amount paid as reported by the caller |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| credit | uint256 | Credit received in return of the payment |

### sendTo

```solidity
function sendTo(contract IERC20 token, address to, uint256 amount) external
```

Sends tokens to a recipient.

_There is no inverse operation for this function. Transfer funds to the Vault and call `settle` to cancel
debts._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | Address of the token |
| to | address | Recipient address |
| amount | uint256 | Amount of tokens to send |

### swap

```solidity
function swap(struct VaultSwapParams vaultSwapParams) external returns (uint256 amountCalculated, uint256 amountIn, uint256 amountOut)
```

Swaps tokens based on provided parameters.

_All parameters are given in raw token decimal encoding._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultSwapParams | struct VaultSwapParams | Parameters for the swap (see above for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountCalculated | uint256 |  |
| amountIn | uint256 |  |
| amountOut | uint256 |  |

### _loadSwapState

```solidity
function _loadSwapState(struct VaultSwapParams vaultSwapParams, struct PoolData poolData) internal pure returns (struct SwapState swapState)
```

### _buildPoolSwapParams

```solidity
function _buildPoolSwapParams(struct VaultSwapParams vaultSwapParams, struct SwapState swapState, struct PoolData poolData) internal view returns (struct PoolSwapParams)
```

### _computeAmountGivenScaled18

```solidity
function _computeAmountGivenScaled18(struct VaultSwapParams vaultSwapParams, struct PoolData poolData, struct SwapState swapState) internal pure returns (uint256)
```

_Preconditions: decimalScalingFactors and tokenRates in `poolData` must be current.
Uses amountGivenRaw and kind from `vaultSwapParams`._

### SwapInternalLocals

_Auxiliary struct to prevent stack-too-deep issues inside `_swap` function.
Total swap fees include LP (pool) fees and aggregate (protocol + pool creator) fees._

```solidity
struct SwapInternalLocals {
  uint256 totalSwapFeeAmountScaled18;
  uint256 totalSwapFeeAmountRaw;
  uint256 aggregateFeeAmountRaw;
}
```

### _swap

```solidity
function _swap(struct VaultSwapParams vaultSwapParams, struct SwapState swapState, struct PoolData poolData, struct PoolSwapParams poolSwapParams) internal returns (uint256 amountCalculatedRaw, uint256 amountCalculatedScaled18, uint256 amountInRaw, uint256 amountOutRaw)
```

_Main non-reentrant portion of the swap, which calls the pool hook and updates accounting. `vaultSwapParams`
are passed to the pool's `onSwap` hook.

Preconditions: complete `SwapParams`, `SwapState`, and `PoolData`.
Side effects: mutates balancesRaw and balancesLiveScaled18 in `poolData`.
Updates `_aggregateFeeAmounts`, and `_poolTokenBalances` in storage.
Emits Swap event._

### addTokenToPool

```solidity
function addTokenToPool(struct AddTokenToPoolParams params) external returns (uint256 bptAmountOut, uint256 tokenIndex)
```

### addLiquidity

```solidity
function addLiquidity(struct AddLiquidityParams params) external returns (uint256[] amountsIn, uint256 bptAmountOut, bytes returnData)
```

Adds liquidity to a pool.

_Caution should be exercised when adding liquidity because the Vault has the capability
to transfer tokens from any user, given that it holds all allowances._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct AddLiquidityParams | Parameters for the add liquidity (see above for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsIn | uint256[] | Actual amounts of input tokens |
| bptAmountOut | uint256 | Output pool token amount |
| returnData | bytes | Arbitrary (optional) data with an encoded response from the pool |

### LiquidityLocals

```solidity
struct LiquidityLocals {
  uint256 numTokens;
  uint256 aggregateSwapFeeAmountRaw;
  uint256 tokenIndex;
}
```

### _addLiquidity

```solidity
function _addLiquidity(struct PoolData poolData, struct AddLiquidityParams params, uint256[] maxAmountsInScaled18) internal returns (uint256[] amountsInRaw, uint256[] amountsInScaled18, uint256 bptAmountOut, bytes returnData)
```

_Calls the appropriate pool hook and calculates the required inputs and outputs for the operation
considering the given kind, and updates the Vault's internal accounting. This includes:
- Setting pool balances
- Taking debt from the liquidity provider
- Minting pool tokens
- Emitting events

It is non-reentrant, as it performs external calls and updates the Vault's state accordingly._

### removeLiquidity

```solidity
function removeLiquidity(struct RemoveLiquidityParams params) external returns (uint256 bptAmountIn, uint256[] amountsOut, bytes returnData)
```

Removes liquidity from a pool.

_Trusted routers can burn pool tokens belonging to any user and require no prior approval from the user.
Untrusted routers require prior approval from the user. This is the only function allowed to call
_queryModeBalanceIncrease (and only in a query context)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct RemoveLiquidityParams | Parameters for the remove liquidity (see above for struct definition) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountIn | uint256 | Actual amount of BPT burned |
| amountsOut | uint256[] | Actual amounts of output tokens |
| returnData | bytes | Arbitrary (optional) data with an encoded response from the pool |

### _removeLiquidity

```solidity
function _removeLiquidity(struct PoolData poolData, struct RemoveLiquidityParams params, uint256[] minAmountsOutScaled18) internal returns (uint256 bptAmountIn, uint256[] amountsOutRaw, uint256[] amountsOutScaled18, bytes returnData)
```

_Calls the appropriate pool hook and calculates the required inputs and outputs for the operation
considering the given kind, and updates the Vault's internal accounting. This includes:
- Setting pool balances
- Supplying credit to the liquidity provider
- Burning pool tokens
- Emitting events

It is non-reentrant, as it performs external calls and updates the Vault's state accordingly._

### _computeAndChargeAggregateSwapFees

```solidity
function _computeAndChargeAggregateSwapFees(struct PoolData poolData, uint256 totalSwapFeeAmountScaled18, address pool, contract IERC20 token, uint256 index) internal returns (uint256 totalSwapFeeAmountRaw, uint256 aggregateSwapFeeAmountRaw)
```

_Preconditions: poolConfigBits, decimalScalingFactors, tokenRates in `poolData`.
Side effects: updates `_aggregateFeeAmounts` storage.
Note that this computes the aggregate total of the protocol fees and stores it, without emitting any events.
Splitting the fees and event emission occur during fee collection.
Should only be called in a non-reentrant context._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| totalSwapFeeAmountRaw | uint256 | Total swap fees raw (LP + aggregate protocol fees) |
| aggregateSwapFeeAmountRaw | uint256 | Sum of protocol and pool creator fees raw |

### getPoolTokenCountAndIndexOfToken

```solidity
function getPoolTokenCountAndIndexOfToken(address pool, contract IERC20 token) external view returns (uint256, uint256)
```

Gets the index of a token in a given pool.

_Reverts if the pool is not registered, or if the token does not belong to the pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool |
| token | contract IERC20 | Address of the token |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |
| [1] | uint256 |  |

### transfer

```solidity
function transfer(address owner, address to, uint256 amount) external returns (bool)
```

Transfers pool token from owner to a recipient.

_Notice that the pool token address is not included in the params. This function is exclusively called by
the pool contract, so msg.sender is used as the token address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | Address of the owner |
| to | address | Address of the recipient |
| amount | uint256 | Amount of tokens to transfer |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | success True if successful, false otherwise |

### transferFrom

```solidity
function transferFrom(address spender, address from, address to, uint256 amount) external returns (bool)
```

Transfers pool token from a sender to a recipient using an allowance.

_Notice that the pool token address is not included in the params. This function is exclusively called by
the pool contract, so msg.sender is used as the token address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| spender | address | Address allowed to perform the transfer |
| from | address | Address of the sender |
| to | address | Address of the recipient |
| amount | uint256 | Amount of tokens to transfer |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### _ensureValidTradeAmount

```solidity
function _ensureValidTradeAmount(uint256 tradeAmount) internal view
```

_If the buffer has enough liquidity, it uses the internal ERC4626 buffer to perform the unwrap
operation without any external calls. If not, it unwraps the assets needed to fulfill the trade + the imbalance
of assets in the buffer, so that the buffer is rebalanced at the end of the operation.

Updates `_reservesOf` and token deltas in storage._

### _ensureValidSwapAmount

```solidity
function _ensureValidSwapAmount(uint256 tradeAmount) internal view
```

### getVaultExtension

```solidity
function getVaultExtension() external view returns (address)
```

Returns the VaultExtension contract address.

_Function is in the main Vault contract. The VaultExtension handles less critical or frequently used
functions, since delegate calls through the Vault are more expensive than direct calls._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address |  |

### _implementation

```solidity
function _implementation() internal view returns (address)
```

_Returns the VaultExtension contract, to which fallback requests are forwarded._

### receive

```solidity
receive() external payable
```

### fallback

```solidity
fallback() external payable
```

_Override proxy implementation of `fallback` to disallow incoming ETH transfers.
This function actually returns whatever the VaultExtension does when handling the request._

