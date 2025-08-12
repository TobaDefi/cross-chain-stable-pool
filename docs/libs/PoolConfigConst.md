# Solidity API

## PoolConfigConst

Helper functions to read and write the packed configuration flags stored in `_poolConfigBits`.

_Note that the entire configuration of each pool is stored in the `_poolConfigBits` mapping (one slot per pool).
This includes the data in the `PoolConfig` struct, plus the data in the `HookFlags` struct. The layout (i.e.,
offsets for each data field) is specified here.

There are two libraries for interpreting these data. `HooksConfigLib` parses fields related to hooks, while
`PoolConfigLib` contains helpers related to the non-hook-related flags, along with aggregate fee percentages
and other data associated with pools._

### POOL_REGISTERED_OFFSET

```solidity
uint8 POOL_REGISTERED_OFFSET
```

### POOL_INITIALIZED_OFFSET

```solidity
uint8 POOL_INITIALIZED_OFFSET
```

### POOL_PAUSED_OFFSET

```solidity
uint8 POOL_PAUSED_OFFSET
```

### POOL_RECOVERY_MODE_OFFSET

```solidity
uint8 POOL_RECOVERY_MODE_OFFSET
```

### UNBALANCED_LIQUIDITY_OFFSET

```solidity
uint8 UNBALANCED_LIQUIDITY_OFFSET
```

### ADD_LIQUIDITY_CUSTOM_OFFSET

```solidity
uint8 ADD_LIQUIDITY_CUSTOM_OFFSET
```

### REMOVE_LIQUIDITY_CUSTOM_OFFSET

```solidity
uint8 REMOVE_LIQUIDITY_CUSTOM_OFFSET
```

### DONATION_OFFSET

```solidity
uint8 DONATION_OFFSET
```

### BEFORE_INITIALIZE_OFFSET

```solidity
uint8 BEFORE_INITIALIZE_OFFSET
```

### ENABLE_HOOK_ADJUSTED_AMOUNTS_OFFSET

```solidity
uint8 ENABLE_HOOK_ADJUSTED_AMOUNTS_OFFSET
```

### AFTER_INITIALIZE_OFFSET

```solidity
uint8 AFTER_INITIALIZE_OFFSET
```

### DYNAMIC_SWAP_FEE_OFFSET

```solidity
uint8 DYNAMIC_SWAP_FEE_OFFSET
```

### BEFORE_SWAP_OFFSET

```solidity
uint8 BEFORE_SWAP_OFFSET
```

### AFTER_SWAP_OFFSET

```solidity
uint8 AFTER_SWAP_OFFSET
```

### BEFORE_ADD_LIQUIDITY_OFFSET

```solidity
uint8 BEFORE_ADD_LIQUIDITY_OFFSET
```

### AFTER_ADD_LIQUIDITY_OFFSET

```solidity
uint8 AFTER_ADD_LIQUIDITY_OFFSET
```

### BEFORE_REMOVE_LIQUIDITY_OFFSET

```solidity
uint8 BEFORE_REMOVE_LIQUIDITY_OFFSET
```

### AFTER_REMOVE_LIQUIDITY_OFFSET

```solidity
uint8 AFTER_REMOVE_LIQUIDITY_OFFSET
```

### STATIC_SWAP_FEE_OFFSET

```solidity
uint8 STATIC_SWAP_FEE_OFFSET
```

### AGGREGATE_SWAP_FEE_OFFSET

```solidity
uint256 AGGREGATE_SWAP_FEE_OFFSET
```

### AGGREGATE_YIELD_FEE_OFFSET

```solidity
uint256 AGGREGATE_YIELD_FEE_OFFSET
```

### DECIMAL_SCALING_FACTORS_OFFSET

```solidity
uint256 DECIMAL_SCALING_FACTORS_OFFSET
```

### PAUSE_WINDOW_END_TIME_OFFSET

```solidity
uint256 PAUSE_WINDOW_END_TIME_OFFSET
```

### TOKEN_DECIMAL_DIFFS_BITLENGTH

```solidity
uint8 TOKEN_DECIMAL_DIFFS_BITLENGTH
```

### DECIMAL_DIFF_BITLENGTH

```solidity
uint8 DECIMAL_DIFF_BITLENGTH
```

### TIMESTAMP_BITLENGTH

```solidity
uint8 TIMESTAMP_BITLENGTH
```

