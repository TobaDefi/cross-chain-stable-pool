# Solidity API

## CREATE3

Deploy to deterministic addresses without an initcode factor.

_Modified from 0xSequence (https://github.com/0xSequence/create3/blob/master/contracts/Create3.sol)
Also avoids dependence on a particular deployer account, and allows for more secure "salt mining" of addresses,
vs. web-based vanity address mining._

### _PROXY_BYTECODE

```solidity
bytes _PROXY_BYTECODE
```

### _PROXY_BYTECODE_HASH

```solidity
bytes32 _PROXY_BYTECODE_HASH
```

### deploy

```solidity
function deploy(bytes32 salt, bytes creationCode, uint256 value) internal returns (address deployed)
```

### getDeployed

```solidity
function getDeployed(bytes32 salt) internal view returns (address)
```

### getDeployed

```solidity
function getDeployed(bytes32 salt, address creator) internal pure returns (address)
```

