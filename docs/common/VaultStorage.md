# Solidity API

## VaultStorage

Storage layout for the Vault.

_This contract has no code, but is inherited by all three Vault contracts. In order to ensure that *only* the
Vault contract's storage is actually used, calls to the extension contracts must be delegate calls made through the
main Vault._

### _MIN_TOKENS

```solidity
uint256 _MIN_TOKENS
```

### _MAX_TOKENS

```solidity
uint256 _MAX_TOKENS
```

### _MAX_TOKEN_DECIMALS

```solidity
uint8 _MAX_TOKEN_DECIMALS
```

### _MAX_PAUSE_WINDOW_DURATION

```solidity
uint256 _MAX_PAUSE_WINDOW_DURATION
```

### _MAX_BUFFER_PERIOD_DURATION

```solidity
uint256 _MAX_BUFFER_PERIOD_DURATION
```

### _MINIMUM_TRADE_AMOUNT

```solidity
uint256 _MINIMUM_TRADE_AMOUNT
```

### _MINIMUM_WRAP_AMOUNT

```solidity
uint256 _MINIMUM_WRAP_AMOUNT
```

### _poolConfigBits

```solidity
mapping(address => PoolConfigBits) _poolConfigBits
```

### _poolRoleAccounts

```solidity
mapping(address => struct PoolRoleAccounts) _poolRoleAccounts
```

### _poolTokens

```solidity
mapping(address => contract IERC20[]) _poolTokens
```

### _poolTokenInfo

```solidity
mapping(address => mapping(contract IERC20 => struct TokenInfo)) _poolTokenInfo
```

### _poolTokensByChainId

```solidity
mapping(address => mapping(uint256 => contract IERC20)) _poolTokensByChainId
```

### _poolTokenBalances

```solidity
mapping(address => mapping(uint256 => bytes32)) _poolTokenBalances
```

### _aggregateFeeAmounts

```solidity
mapping(address => mapping(contract IERC20 => bytes32)) _aggregateFeeAmounts
```

### _vaultPauseWindowEndTime

```solidity
uint32 _vaultPauseWindowEndTime
```

### _vaultBufferPeriodEndTime

```solidity
uint32 _vaultBufferPeriodEndTime
```

### _vaultBufferPeriodDuration

```solidity
uint32 _vaultBufferPeriodDuration
```

### _vaultStateBits

```solidity
VaultStateBits _vaultStateBits
```

### _reservesOf

```solidity
mapping(contract IERC20 => uint256) _reservesOf
```

_Represents the total reserve of each ERC20 token. It should be always equal to `token.balanceOf(vault)`,
except during `unlock`._

### _queriesDisabledPermanently

```solidity
bool _queriesDisabledPermanently
```

_Flag that prevents re-enabling queries._

### _authorizer

```solidity
contract IAuthorizer _authorizer
```

### _protocolFeeController

```solidity
contract IProtocolFeeController _protocolFeeController
```

### _bufferTokenBalances

```solidity
mapping(contract IERC4626 => bytes32) _bufferTokenBalances
```

### _bufferLpShares

```solidity
mapping(contract IERC4626 => mapping(address => uint256)) _bufferLpShares
```

### _bufferTotalShares

```solidity
mapping(contract IERC4626 => uint256) _bufferTotalShares
```

### _bufferAssets

```solidity
mapping(contract IERC4626 => address) _bufferAssets
```

### _isUnlocked

```solidity
function _isUnlocked() internal view returns (StorageSlotExtension.BooleanSlotType slot)
```

### _nonZeroDeltaCount

```solidity
function _nonZeroDeltaCount() internal view returns (StorageSlotExtension.Uint256SlotType slot)
```

### _tokenDeltas

```solidity
function _tokenDeltas() internal view returns (TokenDeltaMappingSlotType slot)
```

### _addLiquidityCalled

```solidity
function _addLiquidityCalled() internal view returns (UintToAddressToBooleanMappingSlot slot)
```

### _sessionIdSlot

```solidity
function _sessionIdSlot() internal view returns (StorageSlotExtension.Uint256SlotType slot)
```

