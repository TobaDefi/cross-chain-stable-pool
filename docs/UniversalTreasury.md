# Solidity API

## UniversalTreasury

### GATEWAY

```solidity
contract IGatewayZEVM GATEWAY
```

The Gateway contract address for ZetaChain Testnet

### BNB_TESTNET

```solidity
uint256 BNB_TESTNET
```

### ETH_TESTNET

```solidity
uint256 ETH_TESTNET
```

### BASE_TOKEN

```solidity
contract IZRC20 BASE_TOKEN
```

The base token contract address, which is a ZRC20 token

### Deposit

```solidity
event Deposit(address user, uint256 amount)
```

### Unauthorized

```solidity
error Unauthorized()
```

### UnsupportedChainID

```solidity
error UnsupportedChainID(uint256 chainID)
```

### UnsupportedToken

```solidity
error UnsupportedToken(address token)
```

### InvalidAmount

```solidity
error InvalidAmount(uint256 amount)
```

### onlyGateway

```solidity
modifier onlyGateway()
```

### constructor

```solidity
constructor() public
```

### onCall

```solidity
function onCall(struct MessageContext context, address zrc20, uint256 amount, bytes message) external
```

### _deposit

```solidity
function _deposit(address user, uint256 amount) internal
```

### balanceOf

```solidity
function balanceOf(address user) external view returns (uint256)
```

### sweep

```solidity
function sweep(address recipient, uint256 amount) external
```

### sweepAll

```solidity
function sweepAll(address recipient) external
```

