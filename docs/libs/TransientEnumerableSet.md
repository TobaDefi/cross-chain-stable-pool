# Solidity API

## TransientEnumerableSet

Library for managing sets of primitive types.

_See https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive types.

Based on the EnumerableSet library from OpenZeppelin Contracts, altered to remove the base private functions that
work on bytes32, replacing them with a native implementation for address values, to reduce bytecode size and
runtime costs. It also uses transient storage.

The `unchecked_at` function was also added, which allows for more gas efficient data reads in some scenarios.

Sets have the following properties:

- Elements are added, removed, and checked for existence in constant time (O(1)).
- Elements are enumerated in O(n). No guarantees are made on the ordering.

```
contract Example {
    // Add the library methods
    using TransientEnumerableSet for TransientEnumerableSet.AddressSet;

    // Declare a set state variable
    TransientEnumerableSet.AddressSet private mySet;
}
```_

### AddressSet

```solidity
struct AddressSet {
  address[] __values;
  mapping(address => uint256) __indexes;
}
```

### IndexOutOfBounds

```solidity
error IndexOutOfBounds()
```

An index is beyond the current bounds of the set.

### ElementNotFound

```solidity
error ElementNotFound()
```

An element that is not present in the set.

### add

```solidity
function add(struct TransientEnumerableSet.AddressSet set, address value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, if it was not already present._

### remove

```solidity
function remove(struct TransientEnumerableSet.AddressSet set, address value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set; i.e., if it was present._

### contains

```solidity
function contains(struct TransientEnumerableSet.AddressSet set, address value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct TransientEnumerableSet.AddressSet set) internal view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### at

```solidity
function at(struct TransientEnumerableSet.AddressSet set, uint256 index) internal view returns (address)
```

_Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}._

### unchecked_at

```solidity
function unchecked_at(struct TransientEnumerableSet.AddressSet set, uint256 index) internal view returns (address)
```

_Same as {at}, except this doesn't revert if `index` it outside of the set (i.e. if it is equal or larger
than {length}). O(1).

This function performs one less storage read than {at}, but should only be used when `index` is known to be
within bounds._

### indexOf

```solidity
function indexOf(struct TransientEnumerableSet.AddressSet set, address value) internal view returns (uint256)
```

_Return the index of an element in the set, or revert if not found._

### unchecked_indexOf

```solidity
function unchecked_indexOf(struct TransientEnumerableSet.AddressSet set, address value) internal view returns (uint256)
```

_Same as {indexOf}, except this doesn't revert if the element isn't present in the set.
In this case, it returns 0.

This function performs one less storage read than {indexOf}, but should only be used when `index` is known to be
within bounds._

### values

```solidity
function values(struct TransientEnumerableSet.AddressSet set) internal view returns (address[] memValues)
```

_Return the raw contents of the underlying address array._

