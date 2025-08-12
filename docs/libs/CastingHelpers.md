# Solidity API

## CastingHelpers

Library of helper functions related to typecasting arrays.

### asIERC20

```solidity
function asIERC20(address[] addresses) internal pure returns (contract IERC20[] tokens)
```

_Returns a native array of addresses as an IERC20[] array._

### asAddress

```solidity
function asAddress(contract IERC20[] tokens) internal pure returns (address[] addresses)
```

_Returns an IERC20[] array as an address[] array._

