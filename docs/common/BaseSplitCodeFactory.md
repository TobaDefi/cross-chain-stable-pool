# Solidity API

## BaseSplitCodeFactory

_Base factory for contracts whose creation code is so large that the factory cannot hold it. This happens when
the contract's creation code grows close to 24kB.

Note that this factory cannot help with contracts that have a *runtime* (deployed) bytecode larger than 24kB._

### constructor

```solidity
constructor(bytes creationCode) public
```

_The creation code of a contract Foo can be obtained inside Solidity with `type(Foo).creationCode`._

### getCreationCodeContracts

```solidity
function getCreationCodeContracts() public view returns (address contractA, address contractB)
```

_Returns the two addresses where the creation code of the contract created by this factory is stored._

### getCreationCode

```solidity
function getCreationCode() public view returns (bytes)
```

_Returns the creation code of the contract this factory creates._

### _create2

```solidity
function _create2(bytes constructorArgs, bytes32 salt) internal virtual returns (address)
```

_Deploys a contract with constructor arguments and a user-provided salt, using the create2 opcode.
To create `constructorArgs`, call `abi.encode()` with the contract's constructor arguments, in order._

### _getDeploymentAddress

```solidity
function _getDeploymentAddress(bytes constructorArgs, bytes32 salt) internal view returns (address)
```

