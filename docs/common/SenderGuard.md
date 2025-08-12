# Solidity API

## SenderGuard

Abstract base contract for functions shared among all Routers.

_Common functionality includes access to the sender (which would normally be obscured, since msg.sender in the
Vault is the Router contract itself, not the account that invoked the Router), versioning, and the external
invocation functions (`permitBatchAndCall` and `multicall`)._

### _MAX_AMOUNT

```solidity
uint256 _MAX_AMOUNT
```

### saveSender

```solidity
modifier saveSender(address sender)
```

Saves the user or contract that initiated the current operation.

_It is possible to nest router calls (e.g., with reentrant hooks), but the sender returned by the Router's
`getSender` function will always be the "outermost" caller. Some transactions require the Router to identify
multiple senders. Consider the following example:

- ContractA has a function that calls the Router, then calls ContractB with the output. ContractB in turn
calls back into the Router.
- Imagine further that ContractA is a pool with a "before" hook that also calls the Router.

When the user calls the function on ContractA, there are three calls to the Router in the same transaction:
- 1st call: When ContractA calls the Router directly, to initiate an operation on the pool (say, a swap).
            (Sender is contractA, initiator of the operation.)

- 2nd call: When the pool operation invokes a hook (say onBeforeSwap), which calls back into the Router.
            This is a "nested" call within the original pool operation. The nested call returns, then the
            before hook returns, the Router completes the operation, and finally returns back to ContractA
            with the result (e.g., a calculated amount of tokens).
            (Nested call; sender is still ContractA through all of this.)

- 3rd call: When the first operation is complete, ContractA calls ContractB, which in turn calls the Router.
            (Not nested, as the original router call from contractA has returned. Sender is now ContractB.)_

### _saveSender

```solidity
function _saveSender(address sender) internal returns (bool isExternalSender)
```

### _discardSenderIfRequired

```solidity
function _discardSenderIfRequired(bool isExternalSender) internal
```

### constructor

```solidity
constructor() internal
```

### getSender

```solidity
function getSender() external view returns (address)
```

Get the first sender which initialized the call to Router.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address |  |

### _getSenderSlot

```solidity
function _getSenderSlot() internal view returns (StorageSlotExtension.AddressSlotType)
```

