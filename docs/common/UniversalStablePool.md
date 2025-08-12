# Solidity API

## UniversalStablePool

### AddLiquidityParams

-------------------- Types --------------------

```solidity
struct AddLiquidityParams {
  address zrc20;
  uint256 amount;
}
```

### RemoveLiquidityParams

```solidity
struct RemoveLiquidityParams {
  address zrc20;
  uint256 amount;
}
```

### GATEWAY

```solidity
contract IGatewayZEVM GATEWAY
```

The Gateway contract address for ZetaChain Testnet

_todo: change to address initialization from the constructor_

### Unauthorized

```solidity
error Unauthorized()
```

Error thrown when the caller is not the Gateway contract.

### LiquidityAdded

```solidity
event LiquidityAdded(address sender, address zrc20, uint256 amount)
```

Event emitted when liquidity is added to the pool.

_todo: add more details to the event if needed or change the event signature_

### LiquidityRemoved

```solidity
event LiquidityRemoved(address sender, address zrc20, uint256 amount, bool withdrawFlag)
```

Event emitted when liquidity is removed from the pool.

_todo: add more details to the event if needed or change the event signature_

### onlyGateway

```solidity
modifier onlyGateway()
```

Modifier that restricts access to the Gateway contract.

### constructor

```solidity
constructor() public
```

_todo: change to constructor in the future_

### onCall

```solidity
function onCall(struct MessageContext context, address zrc20, uint256 amount, bytes) external
```

### addLiquidity

```solidity
function addLiquidity(struct UniversalStablePool.AddLiquidityParams params) external
```

### removeLiquidity

```solidity
function removeLiquidity(struct UniversalStablePool.RemoveLiquidityParams params, bool withdrawFlag) external
```

### _addLiquidity

```solidity
function _addLiquidity(address sender, struct UniversalStablePool.AddLiquidityParams params) internal
```

### _bytesToAddress

```solidity
function _bytesToAddress(bytes b) internal pure returns (address addr)
```

