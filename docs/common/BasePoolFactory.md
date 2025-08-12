# Solidity API

## BasePoolFactory

Base contract for Pool factories.

Pools are deployed from factories to allow third parties to more easily reason about them. Unknown Pools may have
arbitrary logic: being able to assert that a Pool's behavior follows certain rules (those imposed by the contracts
created by the factory) is very powerful.

Note that in v3, the factory alone is not enough to ensure the safety of a pool. v3 pools can have arbitrary hook
contracts, rate providers, complex tokens, and configuration that significantly impacts pool behavior. Specialty
factories can be designed to limit their pools range of behavior (e.g., weighted 80/20 factories where the token
count and weights are fixed).

Since we expect to release new versions of pool types regularly - and the blockchain is forever - versioning will
become increasingly important. Governance can deprecate a factory by calling `disable`, which will permanently
prevent the creation of any future pools from the factory.

Use of factories is also important for security. Calls to `registerPool` or `initialize` made directly on the Vault
could potentially be frontrun. In the case of registration, a DoS attack could register a pool with malicious
parameters, causing the legitimate registration transaction to fail. The standard Balancer factories avoid this by
deploying and registering in a single `create` function.

It would also be possible to frontrun `initialize` (e.g., with unbalanced liquidity), and cause the intended
initialization to fail. Like registration, initialization only happens once. The Balancer standard factories do not
initialize on create, as this would be more complex (e.g., requiring token approvals), and it's very common for the
deployment and funding to be performed from different accounts. Also, frontrunning `initialize` doesn't have serious
consequences, beyond being a DoS.

Nevertheless, this is a factor to consider when launching new pools. To avoid any possibility of frontrunning,
the best practice would be to create (i.e., deploy and register) and initialize in the same transaction.

### StandardPoolWithCreator

```solidity
error StandardPoolWithCreator()
```

A pool creator was specified for a pool from a Balancer core pool type.

### constructor

```solidity
constructor(contract IVault vault, uint32 pauseWindowDuration, bytes creationCode) internal
```

### isPoolFromFactory

```solidity
function isPoolFromFactory(address pool) external view returns (bool)
```

Check whether a pool was deployed by this factory.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### getPoolCount

```solidity
function getPoolCount() external view returns (uint256)
```

Return the total number of pools deployed by this factory.

_This can then be used to "paginate" calls to `getPools` to control gas costs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getPools

```solidity
function getPools() external view returns (address[])
```

Return the complete list of pools deployed by this factory.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] |  |

### getPoolsInRange

```solidity
function getPoolsInRange(uint256 start, uint256 count) external view returns (address[] pools)
```

Return a subset of the list of pools deployed by this factory.

_`start` must be a valid index, but if `count` exceeds the total length, it will not revert, but simply
stop at the end and return fewer results than requested._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| start | uint256 | The index of the first pool to return |
| count | uint256 | The maximum number of pools to return |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| pools | address[] | The list of pools deployed by this factory, starting at `start` and returning up to `count` pools |

### isDisabled

```solidity
function isDisabled() public view returns (bool)
```

Check whether this factory has been disabled by governance.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### getDeploymentAddress

```solidity
function getDeploymentAddress(bytes constructorArgs, bytes32 salt) public view returns (address)
```

Return the address where a new pool will be deployed, based on the factory address and salt.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| constructorArgs | bytes | The arguments used to create the pool |
| salt | bytes32 | The salt used to deploy the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address |  |

### disable

```solidity
function disable() external
```

Disable the factory, preventing the creation of more pools.

_Existing pools are unaffected. Once a factory is disabled, it cannot be re-enabled._

### _ensureEnabled

```solidity
function _ensureEnabled() internal view
```

### _registerPoolWithFactory

```solidity
function _registerPoolWithFactory(address pool) internal virtual
```

### _computeFinalSalt

```solidity
function _computeFinalSalt(bytes32 salt) internal view virtual returns (bytes32)
```

_Factories that require a custom-calculated salt can override to replace this default salt processing.
By default, the pool address determinants include the sender and chain id, as well as the user-provided salt,
so contracts will generally not have the same address on different L2s._

### _create

```solidity
function _create(bytes constructorArgs, bytes32 salt) internal returns (address pool)
```

### _registerPoolWithVault

```solidity
function _registerPoolWithVault(address pool, struct TokenConfig[] tokens, uint256 swapFeePercentage, bool protocolFeeExempt, struct PoolRoleAccounts roleAccounts, address poolHooksContract, struct LiquidityManagement liquidityManagement) internal
```

### getDefaultPoolHooksContract

```solidity
function getDefaultPoolHooksContract() public pure returns (address)
```

A common place to retrieve a default hooks contract. Currently set to address(0) (i.e. no hooks).

### getDefaultLiquidityManagement

```solidity
function getDefaultLiquidityManagement() public pure returns (struct LiquidityManagement liquidityManagement)
```

Convenience function for constructing a LiquidityManagement object.

_Users can call this to create a structure with all false arguments, then set the ones they need to true._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| liquidityManagement | struct LiquidityManagement | Liquidity management flags, all initialized to false |

