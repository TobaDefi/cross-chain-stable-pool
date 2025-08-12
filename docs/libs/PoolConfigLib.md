# Solidity API

## PoolConfigLib

Helper functions to read and write the packed hook configuration flags stored in `_poolConfigBits`.

_Note that the entire configuration of each pool is stored in the `_poolConfigBits` mapping (one slot
per pool). This includes the data in the `PoolConfig` struct, plus the data in the `HookFlags` struct.
The layout (i.e., offsets for each data field) is specified in `PoolConfigConst`.

There are two libraries for interpreting these data. `HooksConfigLib` parses fields related to hooks, while
this one contains helpers related to the non-hook-related flags, along with aggregate fee percentages and
other data associated with pools.

The `PoolData` struct contains the raw bitmap with the entire pool state (`PoolConfigBits`), plus the token
configuration, scaling factors, and dynamic information such as current balances and rates._

### isPoolRegistered

```solidity
function isPoolRegistered(PoolConfigBits config) internal pure returns (bool)
```

### setPoolRegistered

```solidity
function setPoolRegistered(PoolConfigBits config, bool value) internal pure returns (PoolConfigBits)
```

### isPoolInitialized

```solidity
function isPoolInitialized(PoolConfigBits config) internal pure returns (bool)
```

### setPoolInitialized

```solidity
function setPoolInitialized(PoolConfigBits config, bool value) internal pure returns (PoolConfigBits)
```

### isPoolPaused

```solidity
function isPoolPaused(PoolConfigBits config) internal pure returns (bool)
```

### setPoolPaused

```solidity
function setPoolPaused(PoolConfigBits config, bool value) internal pure returns (PoolConfigBits)
```

### isPoolInRecoveryMode

```solidity
function isPoolInRecoveryMode(PoolConfigBits config) internal pure returns (bool)
```

### setPoolInRecoveryMode

```solidity
function setPoolInRecoveryMode(PoolConfigBits config, bool value) internal pure returns (PoolConfigBits)
```

### supportsUnbalancedLiquidity

```solidity
function supportsUnbalancedLiquidity(PoolConfigBits config) internal pure returns (bool)
```

### requireUnbalancedLiquidityEnabled

```solidity
function requireUnbalancedLiquidityEnabled(PoolConfigBits config) internal pure
```

### setDisableUnbalancedLiquidity

```solidity
function setDisableUnbalancedLiquidity(PoolConfigBits config, bool disableUnbalancedLiquidity) internal pure returns (PoolConfigBits)
```

### supportsAddLiquidityCustom

```solidity
function supportsAddLiquidityCustom(PoolConfigBits config) internal pure returns (bool)
```

### requireAddLiquidityCustomEnabled

```solidity
function requireAddLiquidityCustomEnabled(PoolConfigBits config) internal pure
```

### setAddLiquidityCustom

```solidity
function setAddLiquidityCustom(PoolConfigBits config, bool enableAddLiquidityCustom) internal pure returns (PoolConfigBits)
```

### supportsRemoveLiquidityCustom

```solidity
function supportsRemoveLiquidityCustom(PoolConfigBits config) internal pure returns (bool)
```

### requireRemoveLiquidityCustomEnabled

```solidity
function requireRemoveLiquidityCustomEnabled(PoolConfigBits config) internal pure
```

### setRemoveLiquidityCustom

```solidity
function setRemoveLiquidityCustom(PoolConfigBits config, bool enableRemoveLiquidityCustom) internal pure returns (PoolConfigBits)
```

### supportsDonation

```solidity
function supportsDonation(PoolConfigBits config) internal pure returns (bool)
```

### setDonation

```solidity
function setDonation(PoolConfigBits config, bool enableDonation) internal pure returns (PoolConfigBits)
```

### requireDonationEnabled

```solidity
function requireDonationEnabled(PoolConfigBits config) internal pure
```

### getStaticSwapFeePercentage

```solidity
function getStaticSwapFeePercentage(PoolConfigBits config) internal pure returns (uint256)
```

### setStaticSwapFeePercentage

```solidity
function setStaticSwapFeePercentage(PoolConfigBits config, uint256 value) internal pure returns (PoolConfigBits)
```

### getAggregateSwapFeePercentage

```solidity
function getAggregateSwapFeePercentage(PoolConfigBits config) internal pure returns (uint256)
```

### setAggregateSwapFeePercentage

```solidity
function setAggregateSwapFeePercentage(PoolConfigBits config, uint256 value) internal pure returns (PoolConfigBits)
```

### getAggregateYieldFeePercentage

```solidity
function getAggregateYieldFeePercentage(PoolConfigBits config) internal pure returns (uint256)
```

### setAggregateYieldFeePercentage

```solidity
function setAggregateYieldFeePercentage(PoolConfigBits config, uint256 value) internal pure returns (PoolConfigBits)
```

### getTokenDecimalDiffs

```solidity
function getTokenDecimalDiffs(PoolConfigBits config) internal pure returns (uint40)
```

### getDecimalScalingFactors

```solidity
function getDecimalScalingFactors(PoolConfigBits config, uint256 numTokens) internal pure returns (uint256[])
```

### setTokenDecimalDiffs

```solidity
function setTokenDecimalDiffs(PoolConfigBits config, uint40 value) internal pure returns (PoolConfigBits)
```

### getPauseWindowEndTime

```solidity
function getPauseWindowEndTime(PoolConfigBits config) internal pure returns (uint32)
```

### setPauseWindowEndTime

```solidity
function setPauseWindowEndTime(PoolConfigBits config, uint32 value) internal pure returns (PoolConfigBits)
```

### toTokenDecimalDiffs

```solidity
function toTokenDecimalDiffs(uint8[] tokenDecimalDiffs) internal pure returns (uint40)
```

