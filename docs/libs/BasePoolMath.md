# Solidity API

## BasePoolMath

### InvariantRatioAboveMax

```solidity
error InvariantRatioAboveMax(uint256 invariantRatio, uint256 maxInvariantRatio)
```

An add liquidity operation increased the invariant above the limit.

_This value is determined by each pool type, and depends on the specific math used to compute
the price curve._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| invariantRatio | uint256 | The ratio of the new invariant (after an operation) to the old |
| maxInvariantRatio | uint256 | The maximum allowed invariant ratio |

### InvariantRatioBelowMin

```solidity
error InvariantRatioBelowMin(uint256 invariantRatio, uint256 minInvariantRatio)
```

A remove liquidity operation decreased the invariant below the limit.

_This value is determined by each pool type, and depends on the specific math used to compute
the price curve._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| invariantRatio | uint256 | The ratio of the new invariant (after an operation) to the old |
| minInvariantRatio | uint256 | The minimum allowed invariant ratio |

### computeProportionalAmountsIn

```solidity
function computeProportionalAmountsIn(uint256[] balances, uint256 bptTotalSupply, uint256 bptAmountOut) internal pure returns (uint256[] amountsIn)
```

Computes the proportional amounts of tokens to be deposited into the pool.

_This function computes the amount of each token that needs to be deposited in order to mint a specific
amount of pool tokens (BPT). It ensures that the amounts of tokens deposited are proportional to the current
pool balances.

Calculation: For each token, amountIn = balance * (bptAmountOut / bptTotalSupply).
Rounding up is used to ensure that the pool is not underfunded._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| balances | uint256[] | Array of current token balances in the pool |
| bptTotalSupply | uint256 | Total supply of the pool tokens (BPT) |
| bptAmountOut | uint256 | The amount of pool tokens that need to be minted |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsIn | uint256[] | Array of amounts for each token to be deposited |

### computeProportionalAmountsOut

```solidity
function computeProportionalAmountsOut(uint256[] balances, uint256 bptTotalSupply, uint256 bptAmountIn) internal pure returns (uint256[] amountsOut)
```

Computes the proportional amounts of tokens to be withdrawn from the pool.

_This function computes the amount of each token that will be withdrawn in exchange for burning
a specific amount of pool tokens (BPT). It ensures that the amounts of tokens withdrawn are proportional
to the current pool balances.

Calculation: For each token, amountOut = balance * (bptAmountIn / bptTotalSupply).
Rounding down is used to prevent withdrawing more than the pool can afford._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| balances | uint256[] | Array of current token balances in the pool |
| bptTotalSupply | uint256 | Total supply of the pool tokens (BPT) |
| bptAmountIn | uint256 | The amount of pool tokens that will be burned |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountsOut | uint256[] | Array of amounts for each token to be withdrawn |

### computeAddLiquidityUnbalanced

```solidity
function computeAddLiquidityUnbalanced(uint256[] currentBalances, uint256[] exactAmounts, uint256 totalSupply, uint256 swapFeePercentage, contract IBasePool pool) internal view returns (uint256 bptAmountOut, uint256[] swapFeeAmounts)
```

Computes the amount of pool tokens (BPT) to be minted for an unbalanced liquidity addition.

_This function handles liquidity addition where the proportion of tokens deposited does not match
the current pool composition. It considers the current balances, exact amounts of tokens to be added,
total supply, and swap fee percentage. The function calculates a new invariant with the added tokens,
applying swap fees if necessary, and then calculates the amount of BPT to mint based on the change
in the invariant._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentBalances | uint256[] | Current pool balances, sorted in token registration order |
| exactAmounts | uint256[] | Array of exact amounts for each token to be added to the pool |
| totalSupply | uint256 | The current total supply of the pool tokens (BPT) |
| swapFeePercentage | uint256 | The swap fee percentage applied to the transaction |
| pool | contract IBasePool | The pool to which we're adding liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountOut | uint256 | The amount of pool tokens (BPT) that will be minted as a result of the liquidity addition |
| swapFeeAmounts | uint256[] | The amount of swap fees charged for each token |

### computeAddLiquiditySingleTokenExactOut

```solidity
function computeAddLiquiditySingleTokenExactOut(uint256[] currentBalances, uint256 tokenInIndex, uint256 exactBptAmountOut, uint256 totalSupply, uint256 swapFeePercentage, contract IBasePool pool) internal view returns (uint256 amountInWithFee, uint256[] swapFeeAmounts)
```

Computes the amount of input token needed to receive an exact amount of pool tokens (BPT) in a
single-token liquidity addition.

_This function is used when a user wants to add liquidity to the pool by specifying the exact amount
of pool tokens they want to receive, and the function calculates the corresponding amount of the input token.
It considers the current pool balances, total supply, swap fee percentage, and the desired BPT amount._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentBalances | uint256[] | Array of current token balances in the pool, sorted in token registration order |
| tokenInIndex | uint256 | Index of the input token for which the amount needs to be calculated |
| exactBptAmountOut | uint256 | Exact amount of pool tokens (BPT) the user wants to receive |
| totalSupply | uint256 | The current total supply of the pool tokens (BPT) |
| swapFeePercentage | uint256 | The swap fee percentage applied to the taxable amount |
| pool | contract IBasePool | The pool to which we're adding liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountInWithFee | uint256 | The amount of input token needed, including the swap fee, to receive the exact BPT amount |
| swapFeeAmounts | uint256[] | The amount of swap fees charged for each token |

### computeRemoveLiquiditySingleTokenExactOut

```solidity
function computeRemoveLiquiditySingleTokenExactOut(uint256[] currentBalances, uint256 tokenOutIndex, uint256 exactAmountOut, uint256 totalSupply, uint256 swapFeePercentage, contract IBasePool pool) internal view returns (uint256 bptAmountIn, uint256[] swapFeeAmounts)
```

Computes the amount of pool tokens to burn to receive exact amount out.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentBalances | uint256[] | Current pool balances, sorted in token registration order |
| tokenOutIndex | uint256 | Index of the token to receive in exchange for pool tokens burned |
| exactAmountOut | uint256 | Exact amount of tokens to receive |
| totalSupply | uint256 | The current total supply of the pool tokens (BPT) |
| swapFeePercentage | uint256 | The swap fee percentage applied to the taxable amount |
| pool | contract IBasePool | The pool from which we're removing liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| bptAmountIn | uint256 | Amount of pool tokens to burn |
| swapFeeAmounts | uint256[] | The amount of swap fees charged for each token |

### computeRemoveLiquiditySingleTokenExactIn

```solidity
function computeRemoveLiquiditySingleTokenExactIn(uint256[] currentBalances, uint256 tokenOutIndex, uint256 exactBptAmountIn, uint256 totalSupply, uint256 swapFeePercentage, contract IBasePool pool) internal view returns (uint256 amountOutWithFee, uint256[] swapFeeAmounts)
```

Computes the amount of a single token to withdraw for a given amount of BPT to burn.

_It computes the output token amount for an exact input of BPT, considering current balances,
total supply, and swap fees._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| currentBalances | uint256[] | The current token balances in the pool |
| tokenOutIndex | uint256 | The index of the token to be withdrawn |
| exactBptAmountIn | uint256 | The exact amount of BPT the user wants to burn |
| totalSupply | uint256 | The current total supply of the pool tokens (BPT) |
| swapFeePercentage | uint256 | The swap fee percentage applied to the taxable amount |
| pool | contract IBasePool | The pool from which we're removing liquidity |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountOutWithFee | uint256 | The amount of the output token the user receives, accounting for swap fees |
| swapFeeAmounts | uint256[] | The total amount of swap fees charged |

### ensureInvariantRatioBelowMaximumBound

```solidity
function ensureInvariantRatioBelowMaximumBound(contract IBasePool pool, uint256 invariantRatio) internal view
```

Validate the invariant ratio against the maximum bound.

_This is checked when we're adding liquidity, so the `invariantRatio` > 1._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | contract IBasePool | The pool to which we're adding liquidity |
| invariantRatio | uint256 | The ratio of the new invariant (after an operation) to the old |

### ensureInvariantRatioAboveMinimumBound

```solidity
function ensureInvariantRatioAboveMinimumBound(contract IBasePool pool, uint256 invariantRatio) internal view
```

Validate the invariant ratio against the maximum bound.

_This is checked when we're removing liquidity, so the `invariantRatio` < 1._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | contract IBasePool | The pool from which we're removing liquidity |
| invariantRatio | uint256 | The ratio of the new invariant (after an operation) to the old |

