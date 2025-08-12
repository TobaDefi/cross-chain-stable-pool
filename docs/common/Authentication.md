# Solidity API

## Authentication

Building block for performing access control on external functions.

_This contract is used via the `authenticate` modifier (or the `_authenticateCaller` function), which can be
applied to external functions to make them only callable by authorized accounts.

Derived contracts must implement the `_canPerform` function, which holds the actual access control logic._

### constructor

```solidity
constructor(bytes32 actionIdDisambiguator) internal
```

_The main purpose of the `actionIdDisambiguator` is to prevent accidental function selector collisions in
multi-contract systems.

There are two main uses for it:
 - if the contract is a singleton, any unique identifier can be used to make the associated action identifiers
   unique. The contract's own address is a good option.
 - if the contract belongs to a family that shares action identifiers for the same functions, an identifier
   shared by the entire family (and no other contract) should be used instead._

### authenticate

```solidity
modifier authenticate()
```

_Reverts unless the caller is allowed to call this function. Should only be applied to external functions._

### _authenticateCaller

```solidity
function _authenticateCaller() internal view
```

_Reverts unless the caller is allowed to call the entry point function._

### getActionId

```solidity
function getActionId(bytes4 selector) public view returns (bytes32)
```

Returns the action identifier associated with the external function described by `selector`.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| selector | bytes4 | The 4-byte selector of the permissioned function |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 |  |

### _canPerform

```solidity
function _canPerform(bytes32 actionId, address user) internal view virtual returns (bool)
```

_Derived contracts must implement this function to perform the actual access control logic._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| actionId | bytes32 | The action identifier associated with an external function |
| user | address | The account performing the action |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | success True if the action is permitted |

