# Solidity API

## VaultExtension

Bytecode extension for the Vault containing permissionless functions outside the critical path.
It has access to the same storage layout as the main vault.

The functions in this contract are not meant to be called directly. They must only be called by the Vault
via delegate calls, so that any state modifications produced by this contract's code will actually target
the main Vault's state.

The storage of this contract is in practice unused.

### onlyVaultDelegateCall

```solidity
modifier onlyVaultDelegateCall()
```

_Functions with this modifier can only be delegate-called by the Vault._

### _ensureVaultDelegateCall

```solidity
function _ensureVaultDelegateCall() internal view
```

### constructor

```solidity
constructor(contract IVault mainVault, contract IVaultAdmin vaultAdmin) public
```

### vault

```solidity
function vault() external view returns (contract IVault)
```

Returns the main Vault address.

_The main Vault contains the entrypoint and main liquidity operation implementations._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IVault | vault The address of the main Vault |

### getVaultAdmin

```solidity
function getVaultAdmin() external view returns (address)
```

Returns the VaultAdmin contract address.

_The VaultAdmin contract mostly implements permissioned functions._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address |  |

### isUnlocked

```solidity
function isUnlocked() external view returns (bool)
```

Returns whether the Vault is unlocked (i.e., executing an operation).

_The Vault must be unlocked to perform state-changing liquidity operations._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### getNonzeroDeltaCount

```solidity
function getNonzeroDeltaCount() external view returns (uint256)
```

@notice Returns the count of non-zero deltas.
 @return nonzeroDeltaCount The current value of `_nonzeroDeltaCount`

### getTokenDelta

```solidity
function getTokenDelta(contract IERC20 token) external view returns (int256)
```

Retrieves the token delta for a specific token.

_This function allows reading the value from the `_tokenDeltas` mapping._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | The token for which the delta is being fetched |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | int256 |  |

### getReservesOf

```solidity
function getReservesOf(contract IERC20 token) external view returns (uint256)
```

Retrieves the reserve (i.e., total Vault balance) of a given token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | The token for which to retrieve the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getAddLiquidityCalledFlag

```solidity
function getAddLiquidityCalledFlag(address pool) external view returns (bool)
```

This flag is used to detect and tax "round-trip" interactions (adding and removing liquidity in the
same pool).

_Taxing remove liquidity proportional whenever liquidity was added in the same `unlock` call adds an extra
layer of security, discouraging operations that try to undo others for profit. Remove liquidity proportional
is the only standard way to exit a position without fees, and this flag is used to enable fees in that case.
It also discourages indirect swaps via unbalanced add and remove proportional, as they are expected to be worse
than a simple swap for every pool type._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### PoolRegistrationParams

```solidity
struct PoolRegistrationParams {
  struct TokenConfig[] tokenConfig;
  uint256 swapFeePercentage;
  uint32 pauseWindowEndTime;
  bool protocolFeeExempt;
  struct PoolRoleAccounts roleAccounts;
  address poolHooksContract;
  struct LiquidityManagement liquidityManagement;
}
```

### registerPool

```solidity
function registerPool(address pool, struct TokenConfig[] tokenConfig, uint256 swapFeePercentage, uint32 pauseWindowEndTime, bool protocolFeeExempt, struct PoolRoleAccounts roleAccounts, address poolHooksContract, struct LiquidityManagement liquidityManagement) external
```

Registers a pool, associating it with its factory and the tokens it manages.

_A pool can opt-out of pausing by providing a zero value for the pause window, or allow pausing indefinitely
by providing a large value. (Pool pause windows are not limited by the Vault maximums.) The vault defines an
additional buffer period during which a paused pool will stay paused. After the buffer period passes, a paused
pool will automatically unpause. Balancer timestamps are 32 bits.

A pool can opt out of Balancer governance pausing by providing a custom `pauseManager`. This might be a
multi-sig contract or an arbitrary smart contract with its own access controls, that forwards calls to
the Vault.

If the zero address is provided for the `pauseManager`, permissions for pausing the pool will default to the
authorizer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool being registered |
| tokenConfig | struct TokenConfig[] | An array of descriptors for the tokens the pool will manage |
| swapFeePercentage | uint256 | The initial static swap fee percentage of the pool |
| pauseWindowEndTime | uint32 | The timestamp after which it is no longer possible to pause the pool |
| protocolFeeExempt | bool | If true, the pool's initial aggregate fees will be set to 0 |
| roleAccounts | struct PoolRoleAccounts | Addresses the Vault will allow to change certain pool settings |
| poolHooksContract | address | Contract that implements the hooks for the pool |
| liquidityManagement | struct LiquidityManagement | Liquidity management flags with implemented methods |

### _registerPool

```solidity
function _registerPool(address pool, struct VaultExtension.PoolRegistrationParams params) internal
```

_The function will register the pool, setting its tokens with an initial balance of zero.
The function also checks for valid token addresses and ensures that the pool and tokens aren't
already registered.

Emits a `PoolRegistered` event upon successful registration._

### isPoolRegistered

```solidity
function isPoolRegistered(address pool) external view returns (bool)
```

Checks whether a pool is registered.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### initialize

```solidity
function initialize(address pool, address to, contract IERC20[] tokens, uint256[] exactAmountsIn, uint256 minBptAmountOut, bytes userData) external returns (uint256 bptAmountOut)
```

Initializes a registered pool by adding liquidity; mints BPT tokens for the first time in exchange.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool to initialize |
| to | address | Address that will receive the output BPT |
| tokens | contract IERC20[] | Tokens used to seed the pool (must match the registered tokens) |
| exactAmountsIn | uint256[] | Exact amounts of input tokens |
| minBptAmountOut | uint256 | Minimum amount of output pool tokens |
| userData | bytes | Additional (optional) data required for adding initial liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountOut | uint256 | Output pool token amount |

### _initialize

```solidity
function _initialize(address pool, address to, struct PoolData poolData, contract IERC20[] tokens, uint256[] exactAmountsIn, uint256[] exactAmountsInScaled18, uint256 minBptAmountOut) internal returns (uint256 bptAmountOut)
```

### isPoolInitialized

```solidity
function isPoolInitialized(address pool) external view returns (bool)
```

Checks whether a pool is initialized.

_An initialized pool can be considered registered as well._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### getPoolTokens

```solidity
function getPoolTokens(address pool) external view returns (contract IERC20[] tokens)
```

Gets the tokens registered to a pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens | contract IERC20[] | List of tokens in the pool |

### getPoolTokenByChainId

```solidity
function getPoolTokenByChainId(address pool, uint256 chainId) external view returns (contract IERC20 token)
```

Gets the token registered to a pool for a specific chain ID.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool |
| chainId | uint256 | Chain ID to get the token for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20 | The token registered to the pool for the specified chain ID |

### getPoolTokenRates

```solidity
function getPoolTokenRates(address pool) external view returns (uint256[] decimalScalingFactors, uint256[] tokenRates)
```

Gets pool token rates.

_This function performs external calls if tokens are yield-bearing. All returned arrays are in token
registration order._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| decimalScalingFactors | uint256[] | Conversion factor used to adjust for token decimals for uniform precision in calculations. FP(1) for 18-decimal tokens |
| tokenRates | uint256[] | 18-decimal FP values for rate tokens (e.g., yield-bearing), or FP(1) for standard tokens |

### getPoolData

```solidity
function getPoolData(address pool) external view returns (struct PoolData)
```

Returns comprehensive pool data for the given pool.

_This contains the pool configuration (flags), tokens and token types, rates, scaling factors, and balances._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct PoolData |  |

### getPoolTokenInfo

```solidity
function getPoolTokenInfo(address pool) external view returns (contract IERC20[] tokens, struct TokenInfo[] tokenInfo, uint256[] balancesRaw, uint256[] lastBalancesLiveScaled18)
```

Gets the raw data for a pool: tokens, raw balances, scaling factors.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens | contract IERC20[] | The pool tokens, sorted in registration order |
| tokenInfo | struct TokenInfo[] | Token info structs (type, rate provider, yield flag), sorted in token registration order |
| balancesRaw | uint256[] | Current native decimal balances of the pool tokens, sorted in token registration order |
| lastBalancesLiveScaled18 | uint256[] | Last saved live balances, sorted in token registration order |

### getCurrentLiveBalances

```solidity
function getCurrentLiveBalances(address pool) external view returns (uint256[] balancesLiveScaled18)
```

Gets current live balances of a given pool (fixed-point, 18 decimals), corresponding to its tokens in
registration order.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| balancesLiveScaled18 | uint256[] | Token balances after paying yield fees, applying decimal scaling and rates |

### getPoolConfig

```solidity
function getPoolConfig(address pool) external view returns (struct PoolConfig)
```

Gets the configuration parameters of a pool.

_The `PoolConfig` contains liquidity management and other state flags, fee percentages, the pause window._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct PoolConfig |  |

### getBptRate

```solidity
function getBptRate(address pool) external view returns (uint256 rate)
```

The current rate of a pool token (BPT) = invariant / totalSupply.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| rate | uint256 | BPT rate |

### totalSupply

```solidity
function totalSupply(address token) external view returns (uint256)
```

Gets the total supply of a given ERC20 token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The token address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### balanceOf

```solidity
function balanceOf(address token, address account) external view returns (uint256)
```

Gets the balance of an account for a given ERC20 token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | Address of the token |
| account | address | Address of the account |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### allowance

```solidity
function allowance(address token, address owner, address spender) external view returns (uint256)
```

Gets the allowance of a spender for a given ERC20 token and owner.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | Address of the token |
| owner | address | Address of the owner |
| spender | address | Address of the spender |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### approve

```solidity
function approve(address owner, address spender, uint256 amount) external returns (bool)
```

Approves a spender to spend pool tokens on behalf of sender.

_Notice that the pool token address is not included in the params. This function is exclusively called by
the pool contract, so msg.sender is used as the token address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | Address of the owner |
| spender | address | Address of the spender |
| amount | uint256 | Amount of tokens to approve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### isPoolPaused

```solidity
function isPoolPaused(address pool) external view returns (bool)
```

Indicates whether a pool is paused.

_If a pool is paused, all non-Recovery Mode state-changing operations will revert._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool to be checked |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### getPoolPausedState

```solidity
function getPoolPausedState(address pool) external view returns (bool, uint32, uint32, address)
```

Returns the paused status, and end times of the Pool's pause window and buffer period.

_Note that even when set to a paused state, the pool will automatically unpause at the end of
the buffer period. Balancer timestamps are 32 bits._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool whose data is requested |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |
| [1] | uint32 |  |
| [2] | uint32 |  |
| [3] | address |  |

### isERC4626BufferInitialized

```solidity
function isERC4626BufferInitialized(contract IERC4626 wrappedToken) external view returns (bool)
```

Checks if the wrapped token has an initialized buffer in the Vault.

_An initialized buffer should have an asset registered in the Vault._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| wrappedToken | contract IERC4626 | Address of the wrapped token that implements IERC4626 |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### getERC4626BufferAsset

```solidity
function getERC4626BufferAsset(contract IERC4626 wrappedToken) external view returns (address asset)
```

Gets the registered asset for a given buffer.

_To avoid malicious wrappers (e.g., that might potentially change their asset after deployment), routers
should never call `wrapper.asset()` directly, at least without checking it against the asset registered with
the Vault on initialization._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| wrappedToken | contract IERC4626 | The wrapped token specifying the buffer |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The underlying asset of the wrapped token |

### getAggregateSwapFeeAmount

```solidity
function getAggregateSwapFeeAmount(address pool, contract IERC20 token) external view returns (uint256)
```

Returns the accumulated swap fees (including aggregate fees) in `token` collected by the pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool for which aggregate fees have been collected |
| token | contract IERC20 | The address of the token in which fees have been accumulated |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getAggregateYieldFeeAmount

```solidity
function getAggregateYieldFeeAmount(address pool, contract IERC20 token) external view returns (uint256)
```

Returns the accumulated yield fees (including aggregate fees) in `token` collected by the pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool for which aggregate fees have been collected |
| token | contract IERC20 | The address of the token in which fees have been accumulated |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getStaticSwapFeePercentage

```solidity
function getStaticSwapFeePercentage(address pool) external view returns (uint256)
```

Fetches the static swap fee percentage for a given pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool whose static swap fee percentage is being queried |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getPoolRoleAccounts

```solidity
function getPoolRoleAccounts(address pool) external view returns (struct PoolRoleAccounts)
```

Fetches the role accounts for a given pool (pause manager, swap manager, pool creator)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The address of the pool whose roles are being queried |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct PoolRoleAccounts |  |

### getProtocolFeeController

```solidity
function getProtocolFeeController() external view returns (contract IProtocolFeeController)
```

Returns the Protocol Fee Controller address.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IProtocolFeeController |  |

### isPoolInRecoveryMode

```solidity
function isPoolInRecoveryMode(address pool) external view returns (bool)
```

Checks whether a pool is in Recovery Mode.

_Recovery Mode enables a safe proportional withdrawal path, with no external calls._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### RecoveryLocals

```solidity
struct RecoveryLocals {
  contract IERC20[] tokens;
  uint256 swapFeePercentage;
  uint256 numTokens;
  uint256[] swapFeeAmountsRaw;
  uint256[] balancesRaw;
  bool chargeRoundtripFee;
}
```

### removeLiquidityRecovery

```solidity
function removeLiquidityRecovery(address pool, address from, uint256 exactBptAmountIn, uint256[] minAmountsOut) external returns (uint256[] amountsOutRaw)
```

Remove liquidity from a pool specifying exact pool tokens in, with proportional token amounts out.
The request is implemented by the Vault without any interaction with the pool, ensuring that
it works the same for all pools, and cannot be disabled by a new pool type.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | Address of the pool |
| from | address | Address of user to burn pool tokens from |
| exactBptAmountIn | uint256 | Input pool token amount |
| minAmountsOut | uint256[] | Minimum amounts of tokens to be received, sorted in token registration order |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsOutRaw | uint256[] |  |

### query

```solidity
modifier query()
```

_Ensure that only static calls are made to the functions with this modifier._

### _setupQuery

```solidity
function _setupQuery() internal
```

### quote

```solidity
function quote(bytes data) external returns (bytes result)
```

Performs a callback on msg.sender with arguments provided in `data`.

_Used to query a set of operations on the Vault. Only off-chain eth_call are allowed,
anything else will revert.

Allows querying any operation on the Vault that has the `onlyWhenUnlocked` modifier.

Allows the external calling of a function via the Vault contract to
access Vault's functions guarded by `onlyWhenUnlocked`.
`transient` modifier ensuring balances changes within the Vault are settled._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Contains function signature and args to be passed to the msg.sender |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bytes | Resulting data from the call |

### quoteAndRevert

```solidity
function quoteAndRevert(bytes data) external
```

Performs a callback on msg.sender with arguments provided in `data`.

_Used to query a set of operations on the Vault. Only off-chain eth_call are allowed,
anything else will revert.

Allows querying any operation on the Vault that has the `onlyWhenUnlocked` modifier.

Allows the external calling of a function via the Vault contract to
access Vault's functions guarded by `onlyWhenUnlocked`.
`transient` modifier ensuring balances changes within the Vault are settled.

This call always reverts, returning the result in the revert reason._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | Contains function signature and args to be passed to the msg.sender |

### isQueryDisabled

```solidity
function isQueryDisabled() external view returns (bool)
```

Returns true if queries are disabled on the Vault.

_If true, queries might either be disabled temporarily or permanently._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### isQueryDisabledPermanently

```solidity
function isQueryDisabledPermanently() external view returns (bool)
```

Returns true if queries are disabled permanently; false if they are enabled.

_This is a one-way switch. Once queries are disabled permanently, they can never be re-enabled._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool |  |

### getAuthorizer

```solidity
function getAuthorizer() external view returns (contract IAuthorizer)
```

Returns the Authorizer address.

_The authorizer holds the permissions granted by governance. It is set on Vault deployment,
and can be changed through a permissioned call._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IAuthorizer |  |

### _implementation

```solidity
function _implementation() internal view returns (address)
```

_Returns the VaultAdmin contract, to which fallback requests are forwarded._

### emitAuxiliaryEvent

```solidity
function emitAuxiliaryEvent(bytes32 eventKey, bytes eventData) external
```

Pools can use this event to emit event data from the Vault.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| eventKey | bytes32 | Event key |
| eventData | bytes | Encoded event data |

### receive

```solidity
receive() external payable
```

### fallback

```solidity
fallback() external payable
```

_Override proxy implementation of `fallback` to disallow incoming ETH transfers.
This function actually returns whatever the VaultAdmin does when handling the request._

