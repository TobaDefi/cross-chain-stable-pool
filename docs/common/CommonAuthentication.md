# Solidity API

## CommonAuthentication

_Base contract for performing access control on external functions within pools._

### VaultNotSet

```solidity
error VaultNotSet()
```

_Vault cannot be address(0)._

### onlySwapFeeManagerOrGovernance

```solidity
modifier onlySwapFeeManagerOrGovernance(address pool)
```

Caller must be the swapFeeManager, if defined. Otherwise, default to governance.

### constructor

```solidity
constructor(contract IVault vault, bytes32 actionIdDisambiguator) internal
```

### _getVault

```solidity
function _getVault() internal view returns (contract IVault)
```

### _canPerform

```solidity
function _canPerform(bytes32 actionId, address user) internal view returns (bool)
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

### _canPerform

```solidity
function _canPerform(bytes32 actionId, address account, address where) internal view returns (bool)
```

### _ensureAuthenticatedByExclusiveRole

```solidity
function _ensureAuthenticatedByExclusiveRole(address where, address roleAccount) internal view
```

_Ensure the sender is the roleAccount, or default to governance if roleAccount is address(0)._

### _ensureAuthenticatedByRole

```solidity
function _ensureAuthenticatedByRole(address where, address roleAccount) internal view
```

_Ensure the sender is either the role manager, or is authorized by governance (non-exclusive)._

