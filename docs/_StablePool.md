# Solidity API

## StablePool

Standard Balancer Stable Pool.

_Stable Pools are designed for assets that are either expected to consistently swap at near parity,
or at a known exchange rate. Stable Pools use `StableMath` (based on StableSwap, popularized by Curve),
which allows for swaps of significant size before encountering substantial price impact, vastly
increasing capital efficiency for like-kind and correlated-kind swaps.

The `amplificationParameter` determines the "flatness" of the price curve. Higher values "flatten" the
curve, meaning there is a larger range of balances over which tokens will trade near parity, with very low
slippage. Generally, the `amplificationParameter` can be higher for tokens with lower volatility, and pools
with higher liquidity. Lower values more closely approximate the "weighted" math curve, handling greater
volatility at the cost of higher slippage. This parameter can be changed through permissioned calls
(see below for details).

The swap fee percentage is bounded by minimum and maximum values (same as were used in v2)._

### NewPoolParams

Parameters used to deploy a new Stable Pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct NewPoolParams {
  string name;
  string symbol;
  uint256 amplificationParameter;
  string version;
}
```

### AmpUpdateStarted

```solidity
event AmpUpdateStarted(uint256 startValue, uint256 endValue, uint256 startTime, uint256 endTime)
```

An amplification update has started.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startValue | uint256 | Starting value of the amplification parameter |
| endValue | uint256 | Ending value of the amplification parameter |
| startTime | uint256 | Timestamp when the update starts |
| endTime | uint256 | Timestamp when the update is complete |

### AmpUpdateStopped

```solidity
event AmpUpdateStopped(uint256 currentValue)
```

An amplification update has been stopped.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentValue | uint256 | The value at which it stopped |

### AmplificationFactorTooLow

```solidity
error AmplificationFactorTooLow()
```

The amplification factor is below the minimum of the range (1 - 5000).

### AmplificationFactorTooHigh

```solidity
error AmplificationFactorTooHigh()
```

The amplification factor is above the maximum of the range (1 - 5000).

### AmpUpdateDurationTooShort

```solidity
error AmpUpdateDurationTooShort()
```

The amplification change duration is too short.

### AmpUpdateRateTooFast

```solidity
error AmpUpdateRateTooFast()
```

The amplification change rate is too fast.

### AmpUpdateAlreadyStarted

```solidity
error AmpUpdateAlreadyStarted()
```

Amplification update operations must be done one at a time.

### AmpUpdateNotStarted

```solidity
error AmpUpdateNotStarted()
```

Cannot stop an amplification update before it starts.

### constructor

```solidity
constructor(struct StablePool.NewPoolParams params, contract IVault vault) public
```

### computeInvariant

```solidity
function computeInvariant(uint256[] balancesLiveScaled18, enum Rounding rounding) public view returns (uint256)
```

Computes the pool's invariant.

_This function computes the invariant based on current balances (and potentially other pool state).
The rounding direction must be respected for the Vault to round in the pool's favor when calling this function.
If the invariant computation involves no precision loss (e.g. simple sum of balances), the same result can be
returned for both rounding directions.

You can think of the invariant as a measure of the "value" of the pool, which is related to the total liquidity
(i.e., the "BPT rate" is `invariant` / `totalSupply`). Two critical properties must hold:

1) The invariant should not change due to a swap. In practice, it can *increase* due to swap fees, which
effectively add liquidity after the swap - but it should never decrease.

2) The invariant must be "linear"; i.e., increasing the balances proportionally must increase the invariant in
the same proportion: inv(a * n, b * n, c * n) = inv(a, b, c) * n

Property #1 is required to prevent "round trip" paths that drain value from the pool (and all LP shareholders).
Intuitively, an accurate pricing algorithm ensures the user gets an equal value of token out given token in, so
the total value should not change.

Property #2 is essential for the "fungibility" of LP shares. If it did not hold, then different users depositing
the same total value would get a different number of LP shares. In that case, LP shares would not be
interchangeable, as they must be in a fair DEX._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| balancesLiveScaled18 | uint256[] | Token balances after paying yield fees, applying decimal scaling and rates |
| rounding | enum Rounding | Rounding direction to consider when computing the invariant |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### computeBalance

```solidity
function computeBalance(uint256[] balancesLiveScaled18, uint256 tokenInIndex, uint256 invariantRatio) external view returns (uint256 newBalance)
```

Computes a new token balance, given the invariant growth ratio and all other balances.

_Similar to V2's `_getTokenBalanceGivenInvariantAndAllOtherBalances` in StableMath.
The pool must round up for the Vault to round in the protocol's favor when calling this function._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| balancesLiveScaled18 | uint256[] | Token balances after paying yield fees, applying decimal scaling and rates |
| tokenInIndex | uint256 | The index of the token we're computing the balance for, sorted in token registration order |
| invariantRatio | uint256 | The ratio of the new invariant (after an operation) to the old |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| newBalance | uint256 | The new balance of the selected token, after the operation |

### onSwap

```solidity
function onSwap(struct PoolSwapParams request) public view virtual returns (uint256)
```

Execute a swap in the pool.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| request | struct PoolSwapParams |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### startAmplificationParameterUpdate

```solidity
function startAmplificationParameterUpdate(uint256 rawEndValue, uint256 endTime) external
```

Begins changing the amplification parameter to `rawEndValue` over time.

_The value will change linearly until `endTime` is reached, when it will equal `rawEndValue`.
NOTE: Internally, the amplification parameter is represented using higher precision. The values returned by
`getAmplificationParameter` have to be corrected to account for this when comparing to `rawEndValue`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| rawEndValue | uint256 | The desired ending value of the amplification parameter |
| endTime | uint256 | The timestamp when the amplification parameter update is complete |

### stopAmplificationParameterUpdate

```solidity
function stopAmplificationParameterUpdate() external
```

_Stops the amplification parameter change process, keeping the current value._

### getAmplificationParameter

```solidity
function getAmplificationParameter() external view returns (uint256 value, bool isUpdating, uint256 precision)
```

Get all the amplification parameters.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| value | uint256 | Current amplification parameter value (could be in the middle of an update) |
| isUpdating | bool | True if an amplification parameter update is in progress |
| precision | uint256 | The raw value is multiplied by this number for greater precision during updates |

### getAmplificationState

```solidity
function getAmplificationState() external view returns (struct AmplificationState amplificationState, uint256 precision)
```

Get the full state of any ongoing or scheduled amplification parameter update.

_Starting and ending values are returned in their full precision state._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amplificationState | struct AmplificationState | Struct containing the update data |
| precision | uint256 | The raw parameter value is multiplied by this number for greater precision during updates |

### _getAmplificationParameter

```solidity
function _getAmplificationParameter() internal view returns (uint256 value, bool isUpdating)
```

### _stopAmplification

```solidity
function _stopAmplification(uint256 value) internal
```

### getMinimumSwapFeePercentage

```solidity
function getMinimumSwapFeePercentage() external pure returns (uint256)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getMaximumSwapFeePercentage

```solidity
function getMaximumSwapFeePercentage() external pure returns (uint256)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getMinimumInvariantRatio

```solidity
function getMinimumInvariantRatio() external pure returns (uint256)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getMaximumInvariantRatio

```solidity
function getMaximumInvariantRatio() external pure returns (uint256)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getStablePoolDynamicData

```solidity
function getStablePoolDynamicData() external view returns (struct StablePoolDynamicData data)
```

Get dynamic pool data relevant to swap/add/remove calculations.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | struct StablePoolDynamicData | A struct containing all dynamic stable pool parameters |

### getStablePoolImmutableData

```solidity
function getStablePoolImmutableData() external view returns (struct StablePoolImmutableData data)
```

Get immutable pool data relevant to swap/add/remove calculations.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | struct StablePoolImmutableData | A struct containing all immutable stable pool parameters |

