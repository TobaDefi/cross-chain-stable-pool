# Solidity API

## InputHelpers

### InputLengthMismatch

```solidity
error InputLengthMismatch()
```

Arrays passed to a function and intended to be parallel have different lengths.

### MultipleNonZeroInputs

```solidity
error MultipleNonZeroInputs()
```

More than one non-zero value was given for a single token operation.

_Input arrays for single token add/remove liquidity operations are expected to have only one non-zero value,
corresponding to the token being added or removed. This error results if there are multiple non-zero entries._

### AllZeroInputs

```solidity
error AllZeroInputs()
```

No valid input was given for a single token operation.

_Input arrays for single token add/remove liquidity operations are expected to have one non-zero value,
corresponding to the token being added or removed. This error results if all entries are zero._

### TokensNotSorted

```solidity
error TokensNotSorted()
```

The tokens supplied to an array argument were not sorted in numerical order.

_Tokens are not sorted by address on registration. This is an optimization so that off-chain processes can
predict the token order without having to query the Vault. (It is also legacy v2 behavior.)_

### ensureInputLengthMatch

```solidity
function ensureInputLengthMatch(uint256 a, uint256 b) internal pure
```

### ensureInputLengthMatch

```solidity
function ensureInputLengthMatch(uint256 a, uint256 b, uint256 c) internal pure
```

### getSingleInputIndex

```solidity
function getSingleInputIndex(uint256[] maxAmountsIn) internal pure returns (uint256 inputIndex)
```

### sortTokens

```solidity
function sortTokens(contract IERC20[] tokens) internal pure returns (contract IERC20[])
```

_Sort an array of tokens, mutating in place (and also returning them).
This assumes the tokens have been (or will be) validated elsewhere for length
and non-duplication. All this does is the sorting.

A bubble sort should be gas- and bytecode-efficient enough for such small arrays.
Could have also done "manual" comparisons for each of the cases, but this is
about the same number of operations, and more concise.

This is less efficient for larger token count (i.e., above 4), but such pools should
be rare. And in any case, sorting is only done on-chain in test code._

### ensureSortedTokens

```solidity
function ensureSortedTokens(contract IERC20[] tokens) internal pure
```

_Ensure an array of tokens is sorted. As above, does not validate length or uniqueness._

### ensureSortedAmounts

```solidity
function ensureSortedAmounts(uint256[] amounts) internal pure
```

_Ensure an array of amounts is sorted. As above, does not validate length or uniqueness._

