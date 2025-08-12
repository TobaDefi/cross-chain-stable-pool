# Solidity API

## PoolInfo

Standard implementation of the `IPoolInfo` interface.

_Balancer standard pools inherit from this optional interface to provide a standard off-chain interface for
commonly requested data._

### constructor

```solidity
constructor(contract IVault vault) public
```

### getTokens

```solidity
function getTokens() external view returns (contract IERC20[] tokens)
```

Gets the tokens registered in the pool.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens | contract IERC20[] | List of tokens in the pool, sorted in registration order |

### getTokenInfo

```solidity
function getTokenInfo() external view returns (contract IERC20[] tokens, struct TokenInfo[] tokenInfo, uint256[] balancesRaw, uint256[] lastBalancesLiveScaled18)
```

Gets the raw data for the pool: tokens, token info, raw balances, and last live balances.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens | contract IERC20[] | Pool tokens, sorted in token registration order |
| tokenInfo | struct TokenInfo[] | Token info structs (type, rate provider, yield flag), sorted in token registration order |
| balancesRaw | uint256[] | Current native decimal balances of the pool tokens, sorted in token registration order |
| lastBalancesLiveScaled18 | uint256[] | Last saved live balances, sorted in token registration order |

### getCurrentLiveBalances

```solidity
function getCurrentLiveBalances() external view returns (uint256[] balancesLiveScaled18)
```

Gets the current live balances of the pool as fixed point, 18-decimal numbers.

_Note that live balances will not necessarily be accurate if the pool is in Recovery Mode.
Withdrawals in Recovery Mode do not make external calls (including those necessary for updating live balances),
so if there are withdrawals, raw and live balances will be out of sync until Recovery Mode is disabled._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balancesLiveScaled18 | uint256[] | Token balances after paying yield fees, applying decimal scaling and rates |

### getStaticSwapFeePercentage

```solidity
function getStaticSwapFeePercentage() external view returns (uint256)
```

Fetches the static swap fee percentage for the pool.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getAggregateFeePercentages

```solidity
function getAggregateFeePercentages() external view returns (uint256 aggregateSwapFeePercentage, uint256 aggregateYieldFeePercentage)
```

Gets the aggregate swap and yield fee percentages for a pool.

_These are determined by the current protocol and pool creator fees, set in the `ProtocolFeeController`._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| aggregateSwapFeePercentage | uint256 | The aggregate percentage fee applied to swaps |
| aggregateYieldFeePercentage | uint256 | The aggregate percentage fee applied to yield |

