# Solidity API

## ScalingHelpers

Helper functions to apply/undo token decimal and rate adjustments, rounding in the direction indicated.

_To simplify Pool logic, all token balances and amounts are normalized to behave as if the token had
18 decimals. When comparing DAI (18 decimals) and USDC (6 decimals), 1 USDC and 1 DAI would both be
represented as 1e18. This allows us to not consider differences in token decimals in the internal Pool
math, simplifying it greatly.

The Vault does not support tokens with more than 18 decimals (see `_MAX_TOKEN_DECIMALS` in `VaultStorage`),
or tokens that do not implement `IERC20Metadata.decimals`.

These helpers can also be used to scale amounts by other 18-decimal floating point values, such as rates._

### toScaled18ApplyRateRoundDown

```solidity
function toScaled18ApplyRateRoundDown(uint256 amount, uint256 scalingFactor, uint256 tokenRate) internal pure returns (uint256)
```

Applies `scalingFactor` and `tokenRate` to `amount`.

_This may result in a larger or equal value, depending on whether it needed scaling/rate adjustment or not.
The result is rounded down._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to be scaled up to 18 decimals |
| scalingFactor | uint256 | The token decimal scaling factor, `10^(18-tokenDecimals)` |
| tokenRate | uint256 | The token rate scaling factor |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | result The final 18-decimal precision result, rounded down |

### toScaled18ApplyRateRoundUp

```solidity
function toScaled18ApplyRateRoundUp(uint256 amount, uint256 scalingFactor, uint256 tokenRate) internal pure returns (uint256)
```

Applies `scalingFactor` and `tokenRate` to `amount`.

_This may result in a larger or equal value, depending on whether it needed scaling/rate adjustment or not.
The result is rounded up._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to be scaled up to 18 decimals |
| scalingFactor | uint256 | The token decimal scaling factor, `10^(18-tokenDecimals)` |
| tokenRate | uint256 | The token rate scaling factor |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | result The final 18-decimal precision result, rounded up |

### toRawUndoRateRoundDown

```solidity
function toRawUndoRateRoundDown(uint256 amount, uint256 scalingFactor, uint256 tokenRate) internal pure returns (uint256)
```

Reverses the `scalingFactor` and `tokenRate` applied to `amount`.

_This may result in a smaller or equal value, depending on whether it needed scaling/rate adjustment or not.
The result is rounded down._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to be scaled down to native token decimals |
| scalingFactor | uint256 | The token decimal scaling factor, `10^(18-tokenDecimals)` |
| tokenRate | uint256 | The token rate scaling factor |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | result The final native decimal result, rounded down |

### toRawUndoRateRoundUp

```solidity
function toRawUndoRateRoundUp(uint256 amount, uint256 scalingFactor, uint256 tokenRate) internal pure returns (uint256)
```

Reverses the `scalingFactor` and `tokenRate` applied to `amount`.

_This may result in a smaller or equal value, depending on whether it needed scaling/rate adjustment or not.
The result is rounded up._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount to be scaled down to native token decimals |
| scalingFactor | uint256 | The token decimal scaling factor, `10^(18-tokenDecimals)` |
| tokenRate | uint256 | The token rate scaling factor |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | result The final native decimal result, rounded up |

### copyToArray

```solidity
function copyToArray(uint256[] from, uint256[] to) internal pure
```

### toScaled18ApplyRateRoundDownArray

```solidity
function toScaled18ApplyRateRoundDownArray(uint256[] amounts, uint256[] scalingFactors, uint256[] tokenRates) internal pure
```

Same as `toScaled18ApplyRateRoundDown`, but for an entire array.

_This function does not return anything, but instead *mutates* the `amounts` array._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amounts | uint256[] | Amounts to be scaled up to 18 decimals, sorted in token registration order |
| scalingFactors | uint256[] | The token decimal scaling factors, sorted in token registration order |
| tokenRates | uint256[] | The token rate scaling factors, sorted in token registration order |

### copyToScaled18ApplyRateRoundDownArray

```solidity
function copyToScaled18ApplyRateRoundDownArray(uint256[] amounts, uint256[] scalingFactors, uint256[] tokenRates) internal pure returns (uint256[])
```

Same as `toScaled18ApplyRateRoundDown`, but returns a new array, leaving the original intact.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amounts | uint256[] | Amounts to be scaled up to 18 decimals, sorted in token registration order |
| scalingFactors | uint256[] | The token decimal scaling factors, sorted in token registration order |
| tokenRates | uint256[] | The token rate scaling factors, sorted in token registration order |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | results The final 18 decimal results, sorted in token registration order, rounded down |

### toScaled18ApplyRateRoundUpArray

```solidity
function toScaled18ApplyRateRoundUpArray(uint256[] amounts, uint256[] scalingFactors, uint256[] tokenRates) internal pure
```

Same as `toScaled18ApplyRateRoundUp`, but for an entire array.

_This function does not return anything, but instead *mutates* the `amounts` array._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amounts | uint256[] | Amounts to be scaled up to 18 decimals, sorted in token registration order |
| scalingFactors | uint256[] | The token decimal scaling factors, sorted in token registration order |
| tokenRates | uint256[] | The token rate scaling factors, sorted in token registration order |

### copyToScaled18ApplyRateRoundUpArray

```solidity
function copyToScaled18ApplyRateRoundUpArray(uint256[] amounts, uint256[] scalingFactors, uint256[] tokenRates) internal pure returns (uint256[])
```

Same as `toScaled18ApplyRateRoundUp`, but returns a new array, leaving the original intact.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amounts | uint256[] | Amounts to be scaled up to 18 decimals, sorted in token registration order |
| scalingFactors | uint256[] | The token decimal scaling factors, sorted in token registration order |
| tokenRates | uint256[] | The token rate scaling factors, sorted in token registration order |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | results The final 18 decimal results, sorted in token registration order, rounded up |

### computeRateRoundUp

```solidity
function computeRateRoundUp(uint256 rate) internal pure returns (uint256)
```

Rounds up a rate informed by a rate provider.

_Rates calculated by an external rate provider have rounding errors. Intuitively, a rate provider
rounds the rate down so the pool math is executed with conservative amounts. However, when upscaling or
downscaling the amount out, the rate should be rounded up to make sure the amounts scaled are conservative._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| rate | uint256 | The original rate |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | roundedRate The final rate, with rounding applied |

