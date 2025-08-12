# Solidity API

## RouterCommon

Abstract base contract for functions shared among all Routers.

_Common functionality includes access to the sender (which would normally be obscured, since msg.sender in the
Vault is the Router contract itself, not the account that invoked the Router), versioning, and the external
invocation functions (`permitBatchAndCall` and `multicall`)._

### _weth

```solidity
contract IWETH _weth
```

### saveSenderAndManageEth

```solidity
modifier saveSenderAndManageEth()
```

Locks the return of excess ETH to the sender until the end of the function.

_This also encompasses the `saveSender` functionality._

### constructor

```solidity
constructor(contract IVault vault, contract IWETH weth, string routerVersion) internal
```

### getWeth

```solidity
function getWeth() external view returns (contract IWETH)
```

Returns WETH contract address.

### getPermit2

```solidity
function getPermit2() external view returns (address)
```

Returns Permit2 contract address.

### SignatureParts

```solidity
struct SignatureParts {
  bytes32 r;
  bytes32 s;
  uint8 v;
}
```

### permitBatchAndCall

```solidity
function permitBatchAndCall(struct IRouterCommon.PermitApproval[] permitBatch, bytes[] permitSignatures, struct IAllowanceTransfer.PermitBatch permit2Batch, bytes permit2Signature, bytes[] multicallData) external payable virtual returns (bytes[] results)
```

Permits multiple allowances and executes a batch of function calls on this contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| permitBatch | struct IRouterCommon.PermitApproval[] | An array of `PermitApproval` structs, each representing an ERC20 permit request |
| permitSignatures | bytes[] | An array of bytes, corresponding to the permit request signature in `permitBatch` |
| permit2Batch | struct IAllowanceTransfer.PermitBatch | A batch of permit2 approvals |
| permit2Signature | bytes | A permit2 signature for the batch approval |
| multicallData | bytes[] | An array of bytes arrays, each representing an encoded function call on this contract |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| results | bytes[] | Array of bytes arrays, each representing the return data from each function call executed |

### _permitBatch

```solidity
function _permitBatch(struct IRouterCommon.PermitApproval[] permitBatch, bytes[] permitSignatures, struct IAllowanceTransfer.PermitBatch permit2Batch, bytes permit2Signature) internal
```

### multicall

```solidity
function multicall(bytes[] data) public payable virtual returns (bytes[] results)
```

Executes a batch of function calls on this contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes[] | Encoded function calls to be executed in the batch. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| results | bytes[] | Array of bytes arrays, each representing the return data from each function call executed. |

### _returnEth

```solidity
function _returnEth(address sender) internal
```

_Returns excess ETH back to the contract caller. Checks for sufficient ETH balance are made right before
each deposit, ensuring it will revert with a friendly custom error. If there is any balance remaining when
`_returnEth` is called, return it to the sender.

Because the caller might not know exactly how much ETH a Vault action will require, they may send extra.
Note that this excess value is returned *to the contract caller* (msg.sender). If caller and e.g. swap sender
are not the same (because the caller is a relayer for the sender), then it is up to the caller to manage this
returned ETH._

### _getSingleInputArrayAndTokenIndex

```solidity
function _getSingleInputArrayAndTokenIndex(address pool, contract IERC20 token, uint256 amountGiven) internal view returns (uint256[] amountsGiven, uint256 tokenIndex)
```

_Returns an array with `amountGiven` at `tokenIndex`, and 0 for every other index.
The returned array length matches the number of tokens in the pool.
Reverts if the given index is greater than or equal to the pool number of tokens._

### _takeTokenIn

```solidity
function _takeTokenIn(address sender, contract IERC20 tokenIn, uint256 amountIn, bool wethIsEth) internal
```

### _sendTokenOut

```solidity
function _sendTokenOut(address sender, contract IERC20 tokenOut, uint256 amountOut, bool wethIsEth) internal
```

### _maxTokenLimits

```solidity
function _maxTokenLimits(address pool) internal view returns (uint256[] maxLimits)
```

### _isReturnEthLockedSlot

```solidity
function _isReturnEthLockedSlot() internal view returns (StorageSlotExtension.BooleanSlotType)
```

### receive

```solidity
receive() external payable
```

_Enables the Router to receive ETH. This is required for it to be able to unwrap WETH, which sends ETH to the
caller.

Any ETH sent to the Router outside of the WETH unwrapping mechanism would be forever locked inside the Router, so
we prevent that from happening. Other mechanisms used to send ETH to the Router (such as being the recipient of
an ETH swap, Pool exit or withdrawal, contract self-destruction, or receiving the block mining reward) will
result in locked funds, but are not otherwise a security or soundness issue. This check only exists as an attempt
to prevent user error._

