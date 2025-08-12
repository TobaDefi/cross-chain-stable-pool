# Solidity API

## TokenDeltaMappingSlotType

## AddressToUintMappingSlot

## UintToAddressToBooleanMappingSlot

## AddressArraySlotType

## TransientStorageHelpers

Helper functions to read and write values from transient storage, including support for arrays and mappings.

_This is temporary, based on Open Zeppelin's partially released library. When the final version is published, we
should be able to remove our copies and import directly from OZ. When Solidity catches up and puts direct support
for transient storage in the language, we should be able to get rid of this altogether.

This only works on networks where EIP-1153 is supported._

### TransientIndexOutOfBounds

```solidity
error TransientIndexOutOfBounds()
```

An index is out of bounds on an array operation (e.g., at).

### calculateSlot

```solidity
function calculateSlot(string domain, string varName) internal pure returns (bytes32)
```

### tGet

```solidity
function tGet(TokenDeltaMappingSlotType slot, contract IERC20 k1) internal view returns (int256)
```

### tSet

```solidity
function tSet(TokenDeltaMappingSlotType slot, contract IERC20 k1, int256 value) internal
```

### tGet

```solidity
function tGet(AddressToUintMappingSlot slot, address key) internal view returns (uint256)
```

### tSet

```solidity
function tSet(AddressToUintMappingSlot slot, address key, uint256 value) internal
```

### tGet

```solidity
function tGet(UintToAddressToBooleanMappingSlot slot, uint256 uintKey, address addressKey) internal view returns (bool)
```

### tSet

```solidity
function tSet(UintToAddressToBooleanMappingSlot slot, uint256 uintKey, address addressKey, bool value) internal
```

### tAdd

```solidity
function tAdd(AddressToUintMappingSlot slot, address key, uint256 value) internal
```

### tSub

```solidity
function tSub(AddressToUintMappingSlot slot, address key, uint256 value) internal
```

### tLength

```solidity
function tLength(AddressArraySlotType slot) internal view returns (uint256)
```

### tAt

```solidity
function tAt(AddressArraySlotType slot, uint256 index) internal view returns (address)
```

### tSet

```solidity
function tSet(AddressArraySlotType slot, uint256 index, address value) internal
```

### tUncheckedAt

```solidity
function tUncheckedAt(AddressArraySlotType slot, uint256 index) internal view returns (address)
```

### tUncheckedSet

```solidity
function tUncheckedSet(AddressArraySlotType slot, uint256 index, address value) internal
```

### tPush

```solidity
function tPush(AddressArraySlotType slot, address value) internal
```

### tPop

```solidity
function tPop(AddressArraySlotType slot) internal returns (address value)
```

### tIncrement

```solidity
function tIncrement(StorageSlotExtension.Uint256SlotType slot) internal
```

### tDecrement

```solidity
function tDecrement(StorageSlotExtension.Uint256SlotType slot) internal
```

