# Solidity API

## StablePoolFactory

General Stable Pool factory.

_This is the most general factory, which allows up to `StableMath.MAX_STABLE_TOKENS` (5) tokens.
Since this limit is less than Vault's maximum of 8 tokens, we need to enforce this at the factory level._

### constructor

```solidity
constructor(contract IVault vault, uint32 pauseWindowDuration, string factoryVersion, string poolVersion) public
```

### getPoolVersion

```solidity
function getPoolVersion() external view returns (string)
```

Returns a JSON representation of the deployed pool version containing name, version number and task ID.

_This is typically only useful in complex Pool deployment schemes, where multiple subsystems need to know
about each other. Note that this value will only be set at factory creation time._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string |  |

### create

```solidity
function create(string name, string symbol, struct TokenConfig[] tokens, uint256 amplificationParameter, struct PoolRoleAccounts roleAccounts, uint256 swapFeePercentage, address poolHooksContract, bool enableDonation, bool disableUnbalancedLiquidity, bytes32 salt) external returns (address pool)
```

Deploys a new `StablePool`.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The name of the pool |
| symbol | string | The symbol of the pool |
| tokens | struct TokenConfig[] | An array of descriptors for the tokens the pool will manage |
| amplificationParameter | uint256 | Starting value of the amplificationParameter (see StablePool) |
| roleAccounts | struct PoolRoleAccounts | Addresses the Vault will allow to change certain pool settings |
| swapFeePercentage | uint256 | Initial swap fee percentage |
| poolHooksContract | address | Contract that implements the hooks for the pool |
| enableDonation | bool | If true, the pool will support the donation add liquidity mechanism |
| disableUnbalancedLiquidity | bool | If true, only proportional add and remove liquidity are accepted |
| salt | bytes32 | The salt value that will be passed to deployment |

