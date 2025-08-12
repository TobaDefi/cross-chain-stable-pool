# Solidity API

## ProtocolFeeController

Helper contract to manage protocol and creator fees outside the Vault.

_This contract stores global default protocol swap and yield fees, and also tracks the values of those fees
for each pool (the `PoolFeeConfig` described below). Protocol fees can always be overwritten by governance, but
pool creator fees are controlled by the registered poolCreator (see `PoolRoleAccounts`).

The Vault stores a single aggregate percentage for swap and yield fees; only this `ProtocolFeeController` knows
the component fee percentages, and how to compute the aggregate from the components. This is done for performance
reasons, to minimize gas on the critical path, as this way the Vault simply applies a single "cut", and stores the
fee amounts separately from the pool balances.

The pool creator fees are "net" protocol fees, meaning the protocol fee is taken first, and the pool creator fee
percentage is applied to the remainder. Essentially, the protocol is paid first, then the remainder is divided
between the pool creator and the LPs.

There is a permissionless function (`collectAggregateFees`) that transfers these tokens from the Vault to this
contract, and distributes them between the protocol and pool creator, after which they can be withdrawn at any
time by governance and the pool creator, respectively.

Protocol fees can be zero in some cases (e.g., the token is registered as exempt), and pool creator fees are zero
if there is no creator role address defined. Protocol fees are capped at a maximum percentage (50%); pool creator
fees are computed "net" protocol fees, so they can be any value from 0 to 100%. Any combination is possible.
A protocol-fee-exempt pool with a 100% pool creator fee would send all fees to the creator. If there is no pool
creator, a pool with a 50% protocol fee would divide the fees evenly between the protocol and LPs.

This contract is deployed with the Vault, but can be changed by governance._

### ProtocolFeeType

```solidity
enum ProtocolFeeType {
  SWAP,
  YIELD
}
```

### PoolFeeConfig

Fee configuration stored in the swap and yield fee mappings.

_Instead of storing only the fee in the mapping, also store a flag to indicate whether the fee has been
set by governance through a permissioned call. (The fee is stored in 64-bits, so that the struct fits
within a single slot.)

We know the percentage is an 18-decimal FP value, which only takes 60 bits, so it's guaranteed to fit,
and we can do simple casts to truncate the high bits without needed SafeCast.

We want to enable permissionless updates for pools, so that it is less onerous to update potentially
hundreds of pools if the global protocol fees change. However, we don't want to overwrite pools that
have had their fee percentages manually set by the DAO (i.e., after off-chain negotiation and agreement)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct PoolFeeConfig {
  uint64 feePercentage;
  bool isOverride;
}
```

### MAX_PROTOCOL_SWAP_FEE_PERCENTAGE

```solidity
uint256 MAX_PROTOCOL_SWAP_FEE_PERCENTAGE
```

### MAX_PROTOCOL_YIELD_FEE_PERCENTAGE

```solidity
uint256 MAX_PROTOCOL_YIELD_FEE_PERCENTAGE
```

### MAX_CREATOR_FEE_PERCENTAGE

```solidity
uint256 MAX_CREATOR_FEE_PERCENTAGE
```

### _poolProtocolSwapFeePercentages

```solidity
mapping(address => struct ProtocolFeeController.PoolFeeConfig) _poolProtocolSwapFeePercentages
```

### _poolProtocolYieldFeePercentages

```solidity
mapping(address => struct ProtocolFeeController.PoolFeeConfig) _poolProtocolYieldFeePercentages
```

### _registeredPools

```solidity
mapping(address => bool) _registeredPools
```

### _poolCreatorSwapFeePercentages

```solidity
mapping(address => uint256) _poolCreatorSwapFeePercentages
```

### _poolCreatorYieldFeePercentages

```solidity
mapping(address => uint256) _poolCreatorYieldFeePercentages
```

### _protocolFeeAmounts

```solidity
mapping(address => mapping(contract IERC20 => uint256)) _protocolFeeAmounts
```

### _poolCreatorFeeAmounts

```solidity
mapping(address => mapping(contract IERC20 => uint256)) _poolCreatorFeeAmounts
```

### PoolAlreadyRegistered

```solidity
error PoolAlreadyRegistered(address pool)
```

Prevent pool data from being registered more than once.

_This can happen if there is an error in the migration, or if governance somehow grants permission to
`migratePool`, which should never happen._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool |

### InvalidMigrationSource

```solidity
error InvalidMigrationSource()
```

Migration source cannot be this contract.

### onlyPoolCreator

```solidity
modifier onlyPoolCreator(address pool)
```

### withValidSwapFee

```solidity
modifier withValidSwapFee(uint256 newSwapFeePercentage)
```

### withValidYieldFee

```solidity
modifier withValidYieldFee(uint256 newYieldFeePercentage)
```

### withValidPoolCreatorFee

```solidity
modifier withValidPoolCreatorFee(uint256 newPoolCreatorFeePercentage)
```

### withLatestFees

```solidity
modifier withLatestFees(address pool)
```

### constructor

```solidity
constructor(contract IVault vault_, uint256 initialGlobalSwapFeePercentage, uint256 initialGlobalYieldFeePercentage) public
```

### vault

```solidity
function vault() external view returns (contract IVault)
```

Get the address of the main Vault contract.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IVault | vault The Vault address |

### collectAggregateFees

```solidity
function collectAggregateFees(address pool) public
```

Collects aggregate fees from the Vault for a given pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool with aggregate fees |

### collectAggregateFeesHook

```solidity
function collectAggregateFeesHook(address pool) external
```

_Copy and zero out the `aggregateFeeAmounts` collected in the Vault accounting, supplying credit
for each token. Then have the Vault transfer tokens to this contract, debiting each token for the amount
transferred so that the transaction settles when the hook returns._

### _receiveAggregateFees

```solidity
function _receiveAggregateFees(address pool, uint256[] swapFeeAmounts, uint256[] yieldFeeAmounts) internal
```

Settle fee credits from the Vault.

_This must be called after calling `collectAggregateFees` in the Vault. Note that since charging protocol
fees (i.e., distributing tokens between pool and fee balances) occurs in the Vault, but fee collection
happens in the ProtocolFeeController, the swap fees reported here may encompass multiple operations. The Vault
differentiates between swap and yield fees (since they can have different percentage values); the Controller
combines swap and yield fees, then allocates the total between the protocol and pool creator._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool on which the swap fees were charged |
| swapFeeAmounts | uint256[] | An array with the total swap fees collected, sorted in token registration order |
| yieldFeeAmounts | uint256[] | An array with the total yield fees collected, sorted in token registration order |

### getGlobalProtocolSwapFeePercentage

```solidity
function getGlobalProtocolSwapFeePercentage() external view returns (uint256)
```

Getter for the current global protocol swap fee.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getGlobalProtocolYieldFeePercentage

```solidity
function getGlobalProtocolYieldFeePercentage() external view returns (uint256)
```

Getter for the current global protocol yield fee.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### isPoolRegistered

```solidity
function isPoolRegistered(address pool) external view returns (bool)
```

Getter for pool registration flag.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isRegistered True if the pool configuration has been set (e.g., through `registerPool`) |

### getPoolProtocolSwapFeeInfo

```solidity
function getPoolProtocolSwapFeeInfo(address pool) external view returns (uint256, bool)
```

Getter for the current protocol swap fee for a given pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |
| [1] | bool |  |

### getPoolProtocolYieldFeeInfo

```solidity
function getPoolProtocolYieldFeeInfo(address pool) external view returns (uint256, bool)
```

Getter for the current protocol yield fee for a given pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |
| [1] | bool |  |

### getPoolCreatorSwapFeePercentage

```solidity
function getPoolCreatorSwapFeePercentage(address pool) external view returns (uint256)
```

Getter for the current pool creator swap fee percentage for a given pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | poolCreatorSwapFeePercentage The pool creator swap fee component of the aggregate swap fee |

### getPoolCreatorYieldFeePercentage

```solidity
function getPoolCreatorYieldFeePercentage(address pool) external view returns (uint256)
```

Getter for the current pool creator yield fee percentage for a given pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | poolCreatorSwapFeePercentage The pool creator yield fee component of the aggregate yield fee |

### getProtocolFeeAmounts

```solidity
function getProtocolFeeAmounts(address pool) external view returns (uint256[] feeAmounts)
```

Returns the amount of each pool token allocated to the protocol for withdrawal.

_Includes both swap and yield fees._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool on which fees were collected |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmounts | uint256[] | The total amounts of each token available for withdrawal, sorted in token registration order |

### getPoolCreatorFeeAmounts

```solidity
function getPoolCreatorFeeAmounts(address pool) external view returns (uint256[] feeAmounts)
```

Returns the amount of each pool token allocated to the pool creator for withdrawal.

_Includes both swap and yield fees._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool on which fees were collected |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| feeAmounts | uint256[] | The total amounts of each token available for withdrawal, sorted in token registration order |

### computeAggregateFeePercentage

```solidity
function computeAggregateFeePercentage(uint256 protocolFeePercentage, uint256 poolCreatorFeePercentage) external pure returns (uint256)
```

Returns a calculated aggregate percentage from protocol and pool creator fee percentages.

_Not tied to any particular pool; this just performs the low-level "additive fee" calculation. Note that
pool creator fees are calculated based on creatorAndLpFees, and not in totalFees. Since aggregate fees are
stored in the Vault with 24-bit precision, this will truncate any values that require greater precision.
It is expected that pool creators will negotiate with the DAO and agree on reasonable values for these fee
components, but the truncation ensures it will not revert for any valid set of fee percentages.

See example below:

tokenOutAmount = 10000; poolSwapFeePct = 10%; protocolFeePct = 40%; creatorFeePct = 60%
totalFees = tokenOutAmount * poolSwapFeePct = 10000 * 10% = 1000
protocolFees = totalFees * protocolFeePct = 1000 * 40% = 400
creatorAndLpFees = totalFees - protocolFees = 1000 - 400 = 600
creatorFees = creatorAndLpFees * creatorFeePct = 600 * 60% = 360
lpFees (will stay in the pool) = creatorAndLpFees - creatorFees = 600 - 360 = 240_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| protocolFeePercentage | uint256 | The protocol portion of the aggregate fee percentage |
| poolCreatorFeePercentage | uint256 | The pool creator portion of the aggregate fee percentage |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### updateProtocolSwapFeePercentage

```solidity
function updateProtocolSwapFeePercentage(address pool) external
```

Override the protocol swap fee percentage for a specific pool.

_This is a permissionless call, and will set the pool's fee to the current global fee, if it is different
from the current value, and the fee is not controlled by governance (i.e., has never been overridden)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool for which we are setting the protocol swap fee |

### updateProtocolYieldFeePercentage

```solidity
function updateProtocolYieldFeePercentage(address pool) external
```

Override the protocol yield fee percentage for a specific pool.

_This is a permissionless call, and will set the pool's fee to the current global fee, if it is different
from the current value, and the fee is not controlled by governance (i.e., has never been overridden)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool for which we are setting the protocol yield fee |

### _getAggregateFeePercentage

```solidity
function _getAggregateFeePercentage(address pool, enum ProtocolFeeController.ProtocolFeeType feeType) internal view returns (uint256)
```

### _computeAggregateFeePercentage

```solidity
function _computeAggregateFeePercentage(uint256 protocolFeePercentage, uint256 poolCreatorFeePercentage) internal pure returns (uint256 aggregateFeePercentage)
```

### _ensureCallerIsPoolCreator

```solidity
function _ensureCallerIsPoolCreator(address pool) internal view
```

### _getPoolTokensAndCount

```solidity
function _getPoolTokensAndCount(address pool) internal view returns (contract IERC20[] tokens, uint256 numTokens)
```

### _getPoolCreator

```solidity
function _getPoolCreator(address pool) internal view returns (address)
```

### migratePool

```solidity
function migratePool(address pool) external
```

Not exposed in the interface, this enables migration of hidden pool state.

_Permission should NEVER be granted to this function outside of a migration contract. It is necessary to
permit migration of the `ProtocolFeeController` with all state (in particular, protocol fee overrides and pool
creator fees) that cannot be written outside of the `registerPool` function called by the Vault during pool
deployment.

Even if governance were to grant permission to call this function, the `_registeredPools` latch keeps it safe,
guaranteeing that it is impossible to use this function to change anything after registration. A pool can only
be registered / configured once - either copied to a new controller in the migration context, or added normally
through the Vault calling `registerPool`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool to be migrated |

### registerPool

```solidity
function registerPool(address pool, address poolCreator, bool protocolFeeExempt) external returns (uint256 aggregateSwapFeePercentage, uint256 aggregateYieldFeePercentage)
```

Add pool-specific entries to the protocol swap and yield percentages.

_This must be called from the Vault during pool registration. It will initialize the pool to the global
protocol fee percentage values (or 0, if the `protocolFeeExempt` flags is set), and return the initial aggregate
fee percentages, based on an initial pool creator fee of 0._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool being registered |
| poolCreator | address | The address of the pool creator (or 0 if there won't be a pool creator fee) |
| protocolFeeExempt | bool | If true, the pool is initially exempt from protocol fees |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| aggregateSwapFeePercentage | uint256 | The initial aggregate swap fee percentage |
| aggregateYieldFeePercentage | uint256 | The initial aggregate yield fee percentage |

### setGlobalProtocolSwapFeePercentage

```solidity
function setGlobalProtocolSwapFeePercentage(uint256 newProtocolSwapFeePercentage) external
```

Set the global protocol swap fee percentage, used by standard pools.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newProtocolSwapFeePercentage | uint256 | The new protocol swap fee percentage |

### _setGlobalProtocolSwapFeePercentage

```solidity
function _setGlobalProtocolSwapFeePercentage(uint256 newProtocolSwapFeePercentage) internal
```

### setGlobalProtocolYieldFeePercentage

```solidity
function setGlobalProtocolYieldFeePercentage(uint256 newProtocolYieldFeePercentage) external
```

Set the global protocol yield fee percentage, used by standard pools.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newProtocolYieldFeePercentage | uint256 | The new protocol yield fee percentage |

### _setGlobalProtocolYieldFeePercentage

```solidity
function _setGlobalProtocolYieldFeePercentage(uint256 newProtocolYieldFeePercentage) internal
```

### setProtocolSwapFeePercentage

```solidity
function setProtocolSwapFeePercentage(address pool, uint256 newProtocolSwapFeePercentage) external
```

Override the protocol swap fee percentage for a specific pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool for which we are setting the protocol swap fee |
| newProtocolSwapFeePercentage | uint256 | The new protocol swap fee percentage for the pool |

### setProtocolYieldFeePercentage

```solidity
function setProtocolYieldFeePercentage(address pool, uint256 newProtocolYieldFeePercentage) external
```

Override the protocol yield fee percentage for a specific pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool for which we are setting the protocol yield fee |
| newProtocolYieldFeePercentage | uint256 | The new protocol yield fee percentage for the pool |

### setPoolCreatorSwapFeePercentage

```solidity
function setPoolCreatorSwapFeePercentage(address pool, uint256 poolCreatorSwapFeePercentage) external
```

Assigns a new pool creator swap fee percentage to the specified pool.

_Fees are divided between the protocol, pool creator, and LPs. The pool creator percentage is applied to
the "net" amount after protocol fees, and divides the remainder between the pool creator and LPs. If the
pool creator fee is near 100%, almost none of the fee amount remains in the pool for LPs._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool for which the pool creator fee will be changed |
| poolCreatorSwapFeePercentage | uint256 | The new pool creator swap fee percentage to apply to the pool |

### setPoolCreatorYieldFeePercentage

```solidity
function setPoolCreatorYieldFeePercentage(address pool, uint256 poolCreatorYieldFeePercentage) external
```

Assigns a new pool creator yield fee percentage to the specified pool.

_Fees are divided between the protocol, pool creator, and LPs. The pool creator percentage is applied to
the "net" amount after protocol fees, and divides the remainder between the pool creator and LPs. If the
pool creator fee is near 100%, almost none of the fee amount remains in the pool for LPs._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool for which the pool creator fee will be changed |
| poolCreatorYieldFeePercentage | uint256 | The new pool creator yield fee percentage to apply to the pool |

### _setPoolCreatorFeePercentage

```solidity
function _setPoolCreatorFeePercentage(address pool, uint256 poolCreatorFeePercentage, enum ProtocolFeeController.ProtocolFeeType feeType) internal
```

### withdrawProtocolFees

```solidity
function withdrawProtocolFees(address pool, address recipient) external
```

Withdraw collected protocol fees for a given pool (all tokens). This is a permissioned function.

_Sends swap and yield protocol fees to the recipient._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool on which fees were collected |
| recipient | address | Address to send the tokens |

### withdrawProtocolFeesForToken

```solidity
function withdrawProtocolFeesForToken(address pool, address recipient, contract IERC20 token) external
```

Withdraw collected protocol fees for a given pool and a given token. This is a permissioned function.

_Sends swap and yield protocol fees to the recipient._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool on which fees were collected |
| recipient | address | Address to send the tokens |
| token | contract IERC20 | Token to withdraw |

### _withdrawProtocolFees

```solidity
function _withdrawProtocolFees(address pool, address recipient, contract IERC20 token) internal
```

### withdrawPoolCreatorFees

```solidity
function withdrawPoolCreatorFees(address pool, address recipient) external
```

Withdraw collected pool creator fees for a given pool. This is a permissioned function.

_Sends swap and yield pool creator fees to the recipient._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool on which fees were collected |
| recipient | address | Address to send the tokens |

### withdrawPoolCreatorFees

```solidity
function withdrawPoolCreatorFees(address pool) external
```

Withdraw collected pool creator fees for a given pool.

_Sends swap and yield pool creator fees to the registered poolCreator. Since this is a known and immutable
value, this function is permissionless._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool on which fees were collected |

