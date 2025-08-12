# Solidity API

## VaultCommon

Functions and modifiers shared between the main Vault and its extension contracts.

_This contract contains common utilities in the inheritance chain that require storage to work,
and will be required in both the main Vault and its extensions._

### onlyWhenUnlocked

```solidity
modifier onlyWhenUnlocked()
```

_This modifier ensures that the function it modifies can only be called
when a tab has been opened._

### _ensureUnlocked

```solidity
function _ensureUnlocked() internal view
```

### reentrancyGuardEntered

```solidity
function reentrancyGuardEntered() public view returns (bool)
```

Expose the state of the Vault's reentrancy guard.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the Vault is currently executing a nonReentrant function |

### _supplyCredit

```solidity
function _supplyCredit(contract IERC20 token, uint256 credit) internal
```

Records the `credit` for a given token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | The ERC20 token for which the 'credit' will be accounted |
| credit | uint256 | The amount of `token` supplied to the Vault in favor of the caller |

### _takeDebt

```solidity
function _takeDebt(contract IERC20 token, uint256 debt) internal
```

Records the `debt` for a given token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | The ERC20 token for which the `debt` will be accounted |
| debt | uint256 | The amount of `token` taken from the Vault in favor of the caller |

### _accountDelta

```solidity
function _accountDelta(contract IERC20 token, int256 delta) internal
```

_Accounts the delta for the given token. A positive delta represents debt,
while a negative delta represents surplus._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | The ERC20 token for which the delta is being accounted |
| delta | int256 | The difference in the token balance Positive indicates a debit or a decrease in Vault's tokens, negative indicates a credit or an increase in Vault's tokens. |

### whenVaultNotPaused

```solidity
modifier whenVaultNotPaused()
```

_Modifier to make a function callable only when the Vault is not paused._

### _ensureVaultNotPaused

```solidity
function _ensureVaultNotPaused() internal view
```

_Reverts if the Vault is paused._

### _ensureUnpaused

```solidity
function _ensureUnpaused(address pool) internal view
```

_Reverts if the Vault or the given pool are paused._

### _isVaultPaused

```solidity
function _isVaultPaused() internal view returns (bool)
```

_For gas efficiency, storage is only read before `_vaultBufferPeriodEndTime`. Once we're past that
timestamp, the expression short-circuits false, and the Vault is permanently unpaused._

### _ensurePoolNotPaused

```solidity
function _ensurePoolNotPaused(address pool) internal view
```

_Reverts if the pool is paused._

### _isPoolPaused

```solidity
function _isPoolPaused(address pool) internal view returns (bool)
```

_Check both the flag and timestamp to determine whether the pool is paused._

### _getPoolPausedState

```solidity
function _getPoolPausedState(address pool) internal view returns (bool, uint32)
```

_Lowest level routine that plucks only the minimum necessary parts from storage._

### whenVaultBuffersAreNotPaused

```solidity
modifier whenVaultBuffersAreNotPaused()
```

_Modifier to make a function callable only when vault buffers are not paused._

### _ensureVaultBuffersAreNotPaused

```solidity
function _ensureVaultBuffersAreNotPaused() internal view
```

_Reverts if vault buffers are paused._

### withRegisteredPool

```solidity
modifier withRegisteredPool(address pool)
```

_Reverts unless `pool` is a registered Pool._

### withInitializedPool

```solidity
modifier withInitializedPool(address pool)
```

_Reverts unless `pool` is an initialized Pool._

### _ensureRegisteredPool

```solidity
function _ensureRegisteredPool(address pool) internal view
```

### _isPoolRegistered

```solidity
function _isPoolRegistered(address pool) internal view returns (bool)
```

_See `isPoolRegistered`_

### _ensureInitializedPool

```solidity
function _ensureInitializedPool(address pool) internal view
```

### _isPoolInitialized

```solidity
function _isPoolInitialized(address pool) internal view returns (bool)
```

_See `isPoolInitialized`_

### withInitializedBuffer

```solidity
modifier withInitializedBuffer(contract IERC4626 wrappedToken)
```

### _ensureBufferInitialized

```solidity
function _ensureBufferInitialized(contract IERC4626 wrappedToken) internal view
```

### _ensureCorrectBufferAsset

```solidity
function _ensureCorrectBufferAsset(contract IERC4626 wrappedToken, address underlyingToken) internal view
```

_This assumes `underlyingToken` is non-zero; should be called by functions that have already ensured the
buffer has been initialized (e.g., those protected by `withInitializedBuffer`)._

### _writePoolBalancesToStorage

```solidity
function _writePoolBalancesToStorage(address pool, struct PoolData poolData) internal
```

_Packs and sets the raw and live balances of a Pool's tokens to the current values in poolData.balancesRaw
and poolData.liveBalances in the same storage slot._

### _loadPoolData

```solidity
function _loadPoolData(address pool, enum Rounding roundingDirection) internal view returns (struct PoolData poolData)
```

_Fill in PoolData, including paying protocol yield fees and computing final raw and live balances.
In normal operation, we update both balances and fees together. However, while Recovery Mode is enabled,
we cannot track yield fees, as that would involve making external calls that could fail and block withdrawals.

Therefore, disabling Recovery Mode requires writing *only* the balances to storage, so we still need this
as a separate function. It is normally called by `_loadPoolDataUpdatingBalancesAndYieldFees`, but in the
Recovery Mode special case, it is called separately, with the result passed into `_writePoolBalancesToStorage`._

### _loadPoolDataUpdatingBalancesAndYieldFees

```solidity
function _loadPoolDataUpdatingBalancesAndYieldFees(address pool, enum Rounding roundingDirection) internal returns (struct PoolData poolData)
```

_Fill in PoolData, including paying protocol yield fees and computing final raw and live balances.
This function modifies protocol fees and balance storage. Out of an abundance of caution, since `_loadPoolData`
makes external calls, we are making anything that calls it and then modifies storage non-reentrant.
Side effects: updates `_aggregateFeeAmounts` and `_poolTokenBalances` in storage._

### _updateRawAndLiveTokenBalancesInPoolData

```solidity
function _updateRawAndLiveTokenBalancesInPoolData(struct PoolData poolData, uint256 newRawBalance, enum Rounding roundingDirection, uint256 tokenIndex) internal pure returns (uint256)
```

_Updates the raw and live balance of a given token in poolData, scaling the given raw balance by both decimal
and token rates, and rounding the result in the given direction. Assumes scaling factors and rates are current
in PoolData._

### _setStaticSwapFeePercentage

```solidity
function _setStaticSwapFeePercentage(address pool, uint256 swapFeePercentage) internal
```

### _findTokenIndex

```solidity
function _findTokenIndex(contract IERC20[] tokens, contract IERC20 token) internal pure returns (uint256)
```

_Find the index of a token in a token array. Reverts if not found._

### onlyInRecoveryMode

```solidity
modifier onlyInRecoveryMode(address pool)
```

_Place on functions that may only be called when the associated pool is in recovery mode._

### _ensurePoolInRecoveryMode

```solidity
function _ensurePoolInRecoveryMode(address pool) internal view
```

_Reverts if the pool is not in recovery mode._

### _isPoolInRecoveryMode

```solidity
function _isPoolInRecoveryMode(address pool) internal view returns (bool)
```

Checks whether a pool is in recovery mode.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | inRecoveryMode True if the pool is in recovery mode, false otherwise |

### _isQueryContext

```solidity
function _isQueryContext() internal view returns (bool)
```

