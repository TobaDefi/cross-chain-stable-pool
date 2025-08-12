# Solidity API

## WordCodec

Library for encoding and decoding values stored inside a 256 bit word.

_Typically used to pack multiple values in a single slot, saving gas by performing fewer storage accesses.

Each value is defined by its size and the least significant bit in the word, also known as offset. For example, two
128 bit values may be encoded in a word by assigning one an offset of 0, and the other an offset of 128.

We could use Solidity structs to pack values together in a single storage slot instead of relying on a custom and
error-prone library, but unfortunately Solidity only allows for structs to live in either storage, calldata or
memory. Because a memory struct uses not just memory but also a slot in the stack (to store its memory location),
using memory for word-sized values (i.e. of 256 bits or less) is strictly less gas performant, and doesn't even
prevent stack-too-deep issues. This is compounded by the fact that Balancer contracts typically are memory-
intensive, and the cost of accessing memory increases quadratically with the number of allocated words. Manual
packing and unpacking is therefore the preferred approach._

### CodecOverflow

```solidity
error CodecOverflow()
```

Function called with an invalid value.

### OutOfBounds

```solidity
error OutOfBounds()
```

Function called with an invalid bitLength or offset.

### insertUint

```solidity
function insertUint(bytes32 word, uint256 value, uint256 offset, uint256 bitLength) internal pure returns (bytes32 result)
```

_Inserts an unsigned integer of bitLength, shifted by an offset, into a 256 bit word,
replacing the old value. Returns the new word._

### insertAddress

```solidity
function insertAddress(bytes32 word, address value, uint256 offset) internal pure returns (bytes32 result)
```

_Inserts an address (160 bits), shifted by an offset, into a 256 bit word,
replacing the old value. Returns the new word._

### insertInt

```solidity
function insertInt(bytes32 word, int256 value, uint256 offset, uint256 bitLength) internal pure returns (bytes32)
```

_Inserts a signed integer shifted by an offset into a 256 bit word, replacing the old value. Returns
the new word.

Assumes `value` can be represented using `bitLength` bits._

### encodeUint

```solidity
function encodeUint(uint256 value, uint256 offset, uint256 bitLength) internal pure returns (bytes32)
```

_Encodes an unsigned integer shifted by an offset. Ensures value fits within
`bitLength` bits.

The return value can be ORed bitwise with other encoded values to form a 256 bit word._

### encodeInt

```solidity
function encodeInt(int256 value, uint256 offset, uint256 bitLength) internal pure returns (bytes32)
```

_Encodes a signed integer shifted by an offset.

The return value can be ORed bitwise with other encoded values to form a 256 bit word._

### decodeUint

```solidity
function decodeUint(bytes32 word, uint256 offset, uint256 bitLength) internal pure returns (uint256 result)
```

_Decodes and returns an unsigned integer with `bitLength` bits, shifted by an offset, from a 256 bit word._

### decodeInt

```solidity
function decodeInt(bytes32 word, uint256 offset, uint256 bitLength) internal pure returns (int256 result)
```

_Decodes and returns a signed integer with `bitLength` bits, shifted by an offset, from a 256 bit word._

### decodeAddress

```solidity
function decodeAddress(bytes32 word, uint256 offset) internal pure returns (address result)
```

_Decodes and returns an address (160 bits), shifted by an offset, from a 256 bit word._

### decodeBool

```solidity
function decodeBool(bytes32 word, uint256 offset) internal pure returns (bool result)
```

_Decodes and returns a boolean shifted by an offset from a 256 bit word._

### insertBool

```solidity
function insertBool(bytes32 word, bool value, uint256 offset) internal pure returns (bytes32 result)
```

_Inserts a boolean value shifted by an offset into a 256 bit word, replacing the old value.
Returns the new word._

