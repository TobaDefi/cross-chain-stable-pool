# Solidity API

## StorageSlotExtension

Library for reading and writing primitive types to specific storage slots. Based on OpenZeppelin; just adding support for int256.

_TIP: Consider using this library along with {SlotDerivation}._

### Int256Slot

```solidity
struct Int256Slot {
  int256 value;
}
```

### getInt256Slot

```solidity
function getInt256Slot(bytes32 slot) internal pure returns (struct StorageSlotExtension.Int256Slot r)
```

_Returns an `Int256Slot` with member `value` located at `slot`._

### AddressSlotType

### asAddress

```solidity
function asAddress(bytes32 slot) internal pure returns (StorageSlotExtension.AddressSlotType)
```

_Cast an arbitrary slot to a AddressSlotType._

### BooleanSlotType

### asBoolean

```solidity
function asBoolean(bytes32 slot) internal pure returns (StorageSlotExtension.BooleanSlotType)
```

_Cast an arbitrary slot to a BooleanSlotType._

### Bytes32SlotType

### asBytes32

```solidity
function asBytes32(bytes32 slot) internal pure returns (StorageSlotExtension.Bytes32SlotType)
```

_Cast an arbitrary slot to a Bytes32SlotType._

### Uint256SlotType

### asUint256

```solidity
function asUint256(bytes32 slot) internal pure returns (StorageSlotExtension.Uint256SlotType)
```

_Cast an arbitrary slot to a Uint256SlotType._

### Int256SlotType

### asInt256

```solidity
function asInt256(bytes32 slot) internal pure returns (StorageSlotExtension.Int256SlotType)
```

_Cast an arbitrary slot to an Int256SlotType._

### tload

```solidity
function tload(StorageSlotExtension.AddressSlotType slot) internal view returns (address value)
```

_Load the value held at location `slot` in transient storage._

### tstore

```solidity
function tstore(StorageSlotExtension.AddressSlotType slot, address value) internal
```

_Store `value` at location `slot` in transient storage._

### tload

```solidity
function tload(StorageSlotExtension.BooleanSlotType slot) internal view returns (bool value)
```

_Load the value held at location `slot` in transient storage._

### tstore

```solidity
function tstore(StorageSlotExtension.BooleanSlotType slot, bool value) internal
```

_Store `value` at location `slot` in transient storage._

### tload

```solidity
function tload(StorageSlotExtension.Bytes32SlotType slot) internal view returns (bytes32 value)
```

_Load the value held at location `slot` in transient storage._

### tstore

```solidity
function tstore(StorageSlotExtension.Bytes32SlotType slot, bytes32 value) internal
```

_Store `value` at location `slot` in transient storage._

### tload

```solidity
function tload(StorageSlotExtension.Uint256SlotType slot) internal view returns (uint256 value)
```

_Load the value held at location `slot` in transient storage._

### tstore

```solidity
function tstore(StorageSlotExtension.Uint256SlotType slot, uint256 value) internal
```

_Store `value` at location `slot` in transient storage._

### tload

```solidity
function tload(StorageSlotExtension.Int256SlotType slot) internal view returns (int256 value)
```

_Load the value held at location `slot` in transient storage._

### tstore

```solidity
function tstore(StorageSlotExtension.Int256SlotType slot, int256 value) internal
```

_Store `value` at location `slot` in transient storage._

