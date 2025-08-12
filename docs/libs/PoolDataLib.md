# Solidity API

## PoolDataLib

Helper functions to read/write a `PoolData` struct.

_Note that the entire configuration of each pool is stored in the `_poolConfigBits` mapping (one slot per pool).
This includes the data in the `PoolConfig` struct, plus the data in the `HookFlags` struct. The layout (i.e.,
offsets for each data field) is specified in `PoolConfigConst`.

The `PoolData` struct contains the raw bitmap with the entire pool state (`PoolConfigBits`), plus the token
configuration, scaling factors, and dynamic information such as current balances and rates._

### load

```solidity
function load(struct PoolData poolData, mapping(uint256 => bytes32) poolTokenBalances, PoolConfigBits poolConfigBits, mapping(contract IERC20 => struct TokenInfo) poolTokenInfo, contract IERC20[] tokens, enum Rounding roundingDirection) internal view
```

### syncPoolBalancesAndFees

```solidity
function syncPoolBalancesAndFees(struct PoolData poolData, mapping(uint256 => bytes32) poolTokenBalances, mapping(contract IERC20 => bytes32) poolAggregateProtocolFeeAmounts) internal
```

### reloadBalancesAndRates

```solidity
function reloadBalancesAndRates(struct PoolData poolData, mapping(uint256 => bytes32) poolTokenBalances, enum Rounding roundingDirection) internal view
```

_This is typically called after a reentrant callback (e.g., a "before" liquidity operation callback),
to refresh the poolData struct with any balances (or rates) that might have changed.

Preconditions: tokenConfig, balancesRaw, and decimalScalingFactors must be current in `poolData`.
Side effects: mutates tokenRates, balancesLiveScaled18 in `poolData`._

### getTokenRate

```solidity
function getTokenRate(struct TokenInfo tokenInfo) internal view returns (uint256 rate)
```

### updateRawAndLiveBalance

```solidity
function updateRawAndLiveBalance(struct PoolData poolData, uint256 tokenIndex, uint256 newRawBalance, enum Rounding roundingDirection) internal pure
```

### _computeYieldFeesDue

```solidity
function _computeYieldFeesDue(struct PoolData poolData, uint256 lastLiveBalance, uint256 tokenIndex, uint256 aggregateYieldFeePercentage) internal pure returns (uint256 aggregateYieldFeeAmountRaw)
```

