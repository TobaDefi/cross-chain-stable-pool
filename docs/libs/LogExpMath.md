# Solidity API

## LogExpMath

_Exponentiation and logarithm functions for 18 decimal fixed point numbers (both base and exponent/argument).

Exponentiation and logarithm with arbitrary bases (x^y and log_x(y)) are implemented by conversion to natural
exponentiation and logarithm (where the base is Euler's number).

All math operations are unchecked in order to save gas._

### BaseOutOfBounds

```solidity
error BaseOutOfBounds()
```

This error is thrown when a base is not within an acceptable range.

### ExponentOutOfBounds

```solidity
error ExponentOutOfBounds()
```

This error is thrown when a exponent is not within an acceptable range.

### ProductOutOfBounds

```solidity
error ProductOutOfBounds()
```

This error is thrown when the exponent * ln(base) is not within an acceptable range.

### InvalidExponent

```solidity
error InvalidExponent()
```

This error is thrown when an exponent used in the exp function is not within an acceptable range.

### OutOfBounds

```solidity
error OutOfBounds()
```

This error is thrown when a variable or result is not within the acceptable bounds defined in the function.

### ONE_18

```solidity
int256 ONE_18
```

### ONE_20

```solidity
int256 ONE_20
```

### ONE_36

```solidity
int256 ONE_36
```

### MAX_NATURAL_EXPONENT

```solidity
int256 MAX_NATURAL_EXPONENT
```

### MIN_NATURAL_EXPONENT

```solidity
int256 MIN_NATURAL_EXPONENT
```

### LN_36_LOWER_BOUND

```solidity
int256 LN_36_LOWER_BOUND
```

### LN_36_UPPER_BOUND

```solidity
int256 LN_36_UPPER_BOUND
```

### MILD_EXPONENT_BOUND

```solidity
uint256 MILD_EXPONENT_BOUND
```

### x0

```solidity
int256 x0
```

### a0

```solidity
int256 a0
```

### x1

```solidity
int256 x1
```

### a1

```solidity
int256 a1
```

### x2

```solidity
int256 x2
```

### a2

```solidity
int256 a2
```

### x3

```solidity
int256 x3
```

### a3

```solidity
int256 a3
```

### x4

```solidity
int256 x4
```

### a4

```solidity
int256 a4
```

### x5

```solidity
int256 x5
```

### a5

```solidity
int256 a5
```

### x6

```solidity
int256 x6
```

### a6

```solidity
int256 a6
```

### x7

```solidity
int256 x7
```

### a7

```solidity
int256 a7
```

### x8

```solidity
int256 x8
```

### a8

```solidity
int256 a8
```

### x9

```solidity
int256 x9
```

### a9

```solidity
int256 a9
```

### x10

```solidity
int256 x10
```

### a10

```solidity
int256 a10
```

### x11

```solidity
int256 x11
```

### a11

```solidity
int256 a11
```

### pow

```solidity
function pow(uint256 x, uint256 y) internal pure returns (uint256)
```

_Exponentiation (x^y) with unsigned 18 decimal fixed point base and exponent.

Reverts if ln(x) * y is smaller than `MIN_NATURAL_EXPONENT`, or larger than `MAX_NATURAL_EXPONENT`._

### exp

```solidity
function exp(int256 x) internal pure returns (int256)
```

_Natural exponentiation (e^x) with signed 18 decimal fixed point exponent.

Reverts if `x` is smaller than MIN_NATURAL_EXPONENT, or larger than `MAX_NATURAL_EXPONENT`._

### log

```solidity
function log(int256 arg, int256 base) internal pure returns (int256)
```

_Logarithm (log(arg, base), with signed 18 decimal fixed point base and argument._

### ln

```solidity
function ln(int256 a) internal pure returns (int256)
```

_Natural logarithm (ln(a)) with signed 18 decimal fixed point argument._

