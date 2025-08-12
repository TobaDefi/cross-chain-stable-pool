# Solidity API

## RouterWethLib

### InsufficientEth

```solidity
error InsufficientEth()
```

The amount of ETH paid is insufficient to complete this operation.

### wrapEthAndSettle

```solidity
function wrapEthAndSettle(contract IWETH weth, contract IVault vault, uint256 amountToSettle) internal
```

### unwrapWethAndTransferToSender

```solidity
function unwrapWethAndTransferToSender(contract IWETH weth, contract IVault vault, address sender, uint256 amountToSend) internal
```

