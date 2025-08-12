# Solidity API

## AddTokenToPoolParams

```solidity
struct AddTokenToPoolParams {
  address pool;
  address sender;
  struct TokenConfig tokenConfig;
  uint256 exactAmountIn;
}
```

## LiquidityManagement

Represents a pool's liquidity management configuration.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct LiquidityManagement {
  bool disableUnbalancedLiquidity;
  bool enableAddLiquidityCustom;
  bool enableRemoveLiquidityCustom;
  bool enableDonation;
}
```

## PoolConfigBits

## PoolConfig

Represents a pool's configuration (hooks configuration are separated in another struct).

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct PoolConfig {
  struct LiquidityManagement liquidityManagement;
  uint256 staticSwapFeePercentage;
  uint256 aggregateSwapFeePercentage;
  uint256 aggregateYieldFeePercentage;
  uint40 tokenDecimalDiffs;
  uint32 pauseWindowEndTime;
  bool isPoolRegistered;
  bool isPoolInitialized;
  bool isPoolPaused;
  bool isPoolInRecoveryMode;
}
```

## HookFlags

The flag portion of the `HooksConfig`.

_`enableHookAdjustedAmounts` must be true for all contracts that modify the `amountCalculated`
in after hooks. Otherwise, the Vault will ignore any "hookAdjusted" amounts. Setting any "shouldCall"
flags to true will cause the Vault to call the corresponding hook during operations._

```solidity
struct HookFlags {
  bool enableHookAdjustedAmounts;
  bool shouldCallBeforeInitialize;
  bool shouldCallAfterInitialize;
  bool shouldCallComputeDynamicSwapFee;
  bool shouldCallBeforeSwap;
  bool shouldCallAfterSwap;
  bool shouldCallBeforeAddLiquidity;
  bool shouldCallAfterAddLiquidity;
  bool shouldCallBeforeRemoveLiquidity;
  bool shouldCallAfterRemoveLiquidity;
}
```

## HooksConfig

Represents a hook contract configuration for a pool (HookFlags + hooksContract address).

```solidity
struct HooksConfig {
  bool enableHookAdjustedAmounts;
  bool shouldCallBeforeInitialize;
  bool shouldCallAfterInitialize;
  bool shouldCallComputeDynamicSwapFee;
  bool shouldCallBeforeSwap;
  bool shouldCallAfterSwap;
  bool shouldCallBeforeAddLiquidity;
  bool shouldCallAfterAddLiquidity;
  bool shouldCallBeforeRemoveLiquidity;
  bool shouldCallAfterRemoveLiquidity;
  address hooksContract;
}
```

## SwapState

Represents temporary state used during a swap operation.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct SwapState {
  uint256 indexIn;
  uint256 indexOut;
  uint256 amountGivenScaled18;
  uint256 swapFeePercentage;
}
```

## VaultState

Represents the Vault's configuration.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VaultState {
  bool isQueryDisabled;
  bool isVaultPaused;
  bool areBuffersPaused;
}
```

## PoolRoleAccounts

Represents the accounts holding certain roles for a given pool. This is passed in on pool registration.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct PoolRoleAccounts {
  address pauseManager;
  address swapFeeManager;
  address poolCreator;
}
```

## TokenType

Token types supported by the Vault.

_In general, pools may contain any combination of these tokens.

STANDARD tokens (e.g., BAL, WETH) have no rate provider.
WITH_RATE tokens (e.g., wstETH) require a rate provider. These may be tokens like wstETH, which need to be wrapped
because the underlying stETH token is rebasing, and such tokens are unsupported by the Vault. They may also be
tokens like sEUR, which track an underlying asset, but are not yield-bearing. Finally, this encompasses
yield-bearing ERC4626 tokens, which can be used to facilitate swaps without requiring wrapping or unwrapping
in most cases. The `paysYieldFees` flag can be used to indicate whether a token is yield-bearing (e.g., waDAI),
not yield-bearing (e.g., sEUR), or yield-bearing but exempt from fees (e.g., in certain nested pools, where
yield fees are charged elsewhere).

NB: STANDARD must always be the first enum element, so that newly initialized data structures default to Standard._

```solidity
enum TokenType {
  STANDARD,
  WITH_RATE
}
```

## TokenConfig

Encapsulate the data required for the Vault to support a token of the given type.

_For STANDARD tokens, the rate provider address must be 0, and paysYieldFees must be false. All WITH_RATE tokens
need a rate provider, and may or may not be yield-bearing.

At registration time, it is useful to include the token address along with the token parameters in the structure
passed to `registerPool`, as the alternative would be parallel arrays, which would be error prone and require
validation checks. `TokenConfig` is only used for registration, and is never put into storage (see `TokenInfo`)._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct TokenConfig {
  contract IERC20 token;
  uint256 chainId;
  enum TokenType tokenType;
  contract IRateProvider rateProvider;
  bool paysYieldFees;
}
```

## TokenInfo

This data structure is stored in `_poolTokenInfo`, a nested mapping from pool -> (token -> TokenInfo).

_Since the token is already the key of the nested mapping, it would be redundant (and an extra SLOAD) to store
it again in the struct. When we construct PoolData, the tokens are separated into their own array._

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct TokenInfo {
  enum TokenType tokenType;
  contract IRateProvider rateProvider;
  bool paysYieldFees;
}
```

## PoolData

Data structure used to represent the current pool state in memory

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct PoolData {
  PoolConfigBits poolConfigBits;
  contract IERC20[] tokens;
  struct TokenInfo[] tokenInfo;
  uint256[] balancesRaw;
  uint256[] balancesLiveScaled18;
  uint256[] tokenRates;
  uint256[] decimalScalingFactors;
}
```

## Rounding

```solidity
enum Rounding {
  ROUND_UP,
  ROUND_DOWN
}
```

## SwapKind

```solidity
enum SwapKind {
  EXACT_IN,
  EXACT_OUT
}
```

## VaultSwapParams

Data passed into primary Vault `swap` operations.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VaultSwapParams {
  enum SwapKind kind;
  address pool;
  contract IERC20 tokenIn;
  contract IERC20 tokenOut;
  uint256 amountGivenRaw;
  uint256 limitRaw;
  bytes userData;
}
```

## PoolSwapParams

Data for a swap operation, used by contracts implementing `IBasePool`.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct PoolSwapParams {
  enum SwapKind kind;
  uint256 amountGivenScaled18;
  uint256[] balancesScaled18;
  uint256 indexIn;
  uint256 indexOut;
  address router;
  bytes userData;
}
```

## AfterSwapParams

Data for the hook after a swap operation.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct AfterSwapParams {
  enum SwapKind kind;
  contract IERC20 tokenIn;
  contract IERC20 tokenOut;
  uint256 amountInScaled18;
  uint256 amountOutScaled18;
  uint256 tokenInBalanceScaled18;
  uint256 tokenOutBalanceScaled18;
  uint256 amountCalculatedScaled18;
  uint256 amountCalculatedRaw;
  address router;
  address pool;
  bytes userData;
}
```

## AddLiquidityKind

```solidity
enum AddLiquidityKind {
  PROPORTIONAL,
  UNBALANCED,
  SINGLE_TOKEN_EXACT_OUT,
  DONATION,
  CUSTOM
}
```

## AddLiquidityParams

Data for an add liquidity operation.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct AddLiquidityParams {
  address pool;
  address to;
  uint256[] maxAmountsIn;
  uint256 minBptAmountOut;
  enum AddLiquidityKind kind;
  bytes userData;
}
```

## RemoveLiquidityKind

```solidity
enum RemoveLiquidityKind {
  PROPORTIONAL,
  SINGLE_TOKEN_EXACT_IN,
  SINGLE_TOKEN_EXACT_OUT,
  CUSTOM
}
```

## RemoveLiquidityParams

Data for an remove liquidity operation.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct RemoveLiquidityParams {
  address pool;
  address from;
  uint256 maxBptAmountIn;
  uint256[] minAmountsOut;
  enum RemoveLiquidityKind kind;
  bytes userData;
}
```

## WrappingDirection

```solidity
enum WrappingDirection {
  WRAP,
  UNWRAP
}
```

## BufferWrapOrUnwrapParams

Data for a wrap/unwrap operation.

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct BufferWrapOrUnwrapParams {
  enum SwapKind kind;
  enum WrappingDirection direction;
  contract IERC4626 wrappedToken;
  uint256 amountGivenRaw;
  uint256 limitRaw;
}
```

## FEE_BITLENGTH

```solidity
uint256 FEE_BITLENGTH
```

## FEE_SCALING_FACTOR

```solidity
uint256 FEE_SCALING_FACTOR
```

## MAX_FEE_PERCENTAGE

```solidity
uint256 MAX_FEE_PERCENTAGE
```

