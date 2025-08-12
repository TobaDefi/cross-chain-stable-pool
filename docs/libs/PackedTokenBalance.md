# Solidity API

## PackedTokenBalance

This library represents a data structure for packing a token's current raw and derived balances. A derived
balance can be the "last" live balance scaled18 of the raw token, or the balance of the wrapped version of the
token in a vault buffer, among others.

_We could use a Solidity struct to pack balance values together in a single storage slot, but unfortunately
Solidity only allows for structs to live in either storage, calldata or memory. Because a memory struct still takes
up a slot in the stack (to store its memory location), and because the entire balance fits in a single stack slot
(two 128 bit values), using memory is strictly less gas performant. Therefore, we do manual packing and unpacking.

We could also use custom types now, but given the simplicity here, and the existing EnumerableMap type, it seemed
easier to leave it as a bytes32._

### BalanceOverflow

```solidity
error BalanceOverflow()
```

One of the balances is above the maximum value that can be stored.

### getBalanceRaw

```solidity
function getBalanceRaw(bytes32 balance) internal pure returns (uint256)
```

### getBalanceDerived

```solidity
function getBalanceDerived(bytes32 balance) internal pure returns (uint256)
```

### setBalanceRaw

```solidity
function setBalanceRaw(bytes32 balance, uint256 newBalanceRaw) internal pure returns (bytes32)
```

_Sets only the raw balance of balances and returns the new bytes32 balance._

### setBalanceDerived

```solidity
function setBalanceDerived(bytes32 balance, uint256 newBalanceDerived) internal pure returns (bytes32)
```

_Sets only the derived balance of balances and returns the new bytes32 balance._

### toPackedBalance

```solidity
function toPackedBalance(uint256 balanceRaw, uint256 balanceDerived) internal pure returns (bytes32)
```

_Validates the size of `balanceRaw` and `balanceDerived`, then returns a packed balance bytes32._

### fromPackedBalance

```solidity
function fromPackedBalance(bytes32 balance) internal pure returns (uint256 balanceRaw, uint256 balanceDerived)
```

_Decode and fetch both balances._

