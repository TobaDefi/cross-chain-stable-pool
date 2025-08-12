# Solidity API

## Bytes32AddressLib

Library for converting between addresses and bytes32 values.

_Used in CREATE3 contract deployment._

### fromLast20Bytes

```solidity
function fromLast20Bytes(bytes32 bytesValue) internal pure returns (address)
```

### fillLast12Bytes

```solidity
function fillLast12Bytes(address addressValue) internal pure returns (bytes32)
```

