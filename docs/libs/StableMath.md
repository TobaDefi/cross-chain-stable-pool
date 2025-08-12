# Solidity API

## StableMath

Stable Pool math library based on Curve's `StableSwap`.

_See https://docs.curve.fi/references/whitepapers/stableswap/

For security reasons, to help ensure that for all possible "round trip" paths the caller always receives the same
or fewer tokens than supplied, we have used precise math (i.e., '*', '/' vs. FixedPoint) whenever possible, and
chosen the rounding direction to favor the protocol elsewhere.

`computeInvariant` does not use the rounding direction from `IBasePool`, effectively always rounding down to match
the Curve implementation._

### StableInvariantDidNotConverge

```solidity
error StableInvariantDidNotConverge()
```

The iterations to calculate the invariant didn't converge.

### StableComputeBalanceDidNotConverge

```solidity
error StableComputeBalanceDidNotConverge()
```

The iterations to calculate the balance didn't converge.

### MAX_STABLE_TOKENS

```solidity
uint256 MAX_STABLE_TOKENS
```

### MIN_AMP

```solidity
uint256 MIN_AMP
```

### MAX_AMP

```solidity
uint256 MAX_AMP
```

### AMP_PRECISION

```solidity
uint256 AMP_PRECISION
```

### MIN_INVARIANT_RATIO

```solidity
uint256 MIN_INVARIANT_RATIO
```

### MAX_INVARIANT_RATIO

```solidity
uint256 MAX_INVARIANT_RATIO
```

### computeInvariant

```solidity
function computeInvariant(uint256 amplificationParameter, uint256[] balances) internal pure returns (uint256)
```

Computes the invariant given the current balances.

_It uses the Newton-Raphson approximation. The amplification parameter is given by: A n^(n-1).
There is no closed-form solution, so the calculation is iterative and may revert._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amplificationParameter | uint256 | The current amplification parameter |
| balances | uint256[] | The current balances |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | invariant The calculated invariant of the pool |

### computeOutGivenExactIn

```solidity
function computeOutGivenExactIn(uint256 amplificationParameter, uint256[] balances, uint256 tokenIndexIn, uint256 tokenIndexOut, uint256 tokenAmountIn, uint256 invariant) internal pure returns (uint256)
```

Computes the required `amountOut` of tokenOut, for `tokenAmountIn` of tokenIn.

_The calculation uses the Newton-Raphson approximation. The amplification parameter is given by: A n^(n-1)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amplificationParameter | uint256 | The current amplification factor |
| balances | uint256[] | The current pool balances |
| tokenIndexIn | uint256 | The index of tokenIn |
| tokenIndexOut | uint256 | The index of tokenOut |
| tokenAmountIn | uint256 | The exact amount of tokenIn specified for the swap |
| invariant | uint256 | The current invariant |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | amountOut The calculated amount of tokenOut required for the swap |

### computeInGivenExactOut

```solidity
function computeInGivenExactOut(uint256 amplificationParameter, uint256[] balances, uint256 tokenIndexIn, uint256 tokenIndexOut, uint256 tokenAmountOut, uint256 invariant) internal pure returns (uint256)
```

Computes the required `amountIn` of tokenIn, for `tokenAmountOut` of tokenOut.

_The calculation uses the Newton-Raphson approximation. The amplification parameter is given by: A n^(n-1)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amplificationParameter | uint256 | The current amplification factor |
| balances | uint256[] | The current pool balances |
| tokenIndexIn | uint256 | The index of tokenIn |
| tokenIndexOut | uint256 | The index of tokenOut |
| tokenAmountOut | uint256 | The exact amount of tokenOut specified for the swap |
| invariant | uint256 | The current invariant |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | amountIn The calculated amount of tokenIn required for the swap |

### computeBalance

```solidity
function computeBalance(uint256 amplificationParameter, uint256[] balances, uint256 invariant, uint256 tokenIndex) internal pure returns (uint256)
```

Calculate the balance of a given token (at tokenIndex), given all other balances and the invariant.

_Rounds result up overall. There is no closed-form solution, so the calculation is iterative and may revert._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amplificationParameter | uint256 | The current amplification factor |
| balances | uint256[] | The current pool balances |
| invariant | uint256 | The current invariant |
| tokenIndex | uint256 | The index of the token balance we are calculating |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | tokenBalance The adjusted balance of the token at `tokenIn` that matches the given invariant |

