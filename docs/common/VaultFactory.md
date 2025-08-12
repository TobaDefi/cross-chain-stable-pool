# Solidity API

## VaultFactory

One-off factory to deploy the Vault at a specific address.

### vaultCreationCodeHash

```solidity
bytes32 vaultCreationCodeHash
```

### vaultAdminCreationCodeHash

```solidity
bytes32 vaultAdminCreationCodeHash
```

### vaultExtensionCreationCodeHash

```solidity
bytes32 vaultExtensionCreationCodeHash
```

### deployedVaultExtensions

```solidity
mapping(address => contract VaultExtension) deployedVaultExtensions
```

### deployedVaultAdmins

```solidity
mapping(address => contract VaultAdmin) deployedVaultAdmins
```

### isDeployed

```solidity
mapping(address => bool) isDeployed
```

### VaultCreated

```solidity
event VaultCreated(address vault)
```

Emitted when the Vault is deployed.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| vault | address | The Vault's address |

### VaultAddressMismatch

```solidity
error VaultAddressMismatch()
```

The given salt does not match the generated address when attempting to create the Vault.

### InvalidBytecode

```solidity
error InvalidBytecode(string contractName)
```

The bytecode for the given contract does not match the expected bytecode.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contractName | string | The name of the mismatched contract |

### VaultAlreadyDeployed

```solidity
error VaultAlreadyDeployed(address vault)
```

The Vault has already been deployed at this target address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| vault | address | Vault address already consumed by a previous deployment |

### InvalidProtocolFeeController

```solidity
error InvalidProtocolFeeController()
```

The ProtocolFeeController cannot be the zero address.

### constructor

```solidity
constructor(contract IAuthorizer authorizer, uint32 pauseWindowDuration, uint32 bufferPeriodDuration, uint256 minTradeAmount, uint256 minWrapAmount, bytes32 vaultCreationCodeHash_, bytes32 vaultExtensionCreationCodeHash_, bytes32 vaultAdminCreationCodeHash_) public
```

### create

```solidity
function create(bytes32 salt, address targetAddress, contract IProtocolFeeController protocolFeeController, bytes vaultCreationCode, bytes vaultExtensionCreationCode, bytes vaultAdminCreationCode) external
```

Deploys the Vault.

_The Vault can only be deployed once per salt. This function is permissioned._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| salt | bytes32 | Salt used to create the Vault. See `getDeploymentAddress` |
| targetAddress | address | Expected Vault address. The function will revert if the given salt does not deploy the Vault to the target address |
| protocolFeeController | contract IProtocolFeeController | The address of the previously deployed ProtocolFeeController |
| vaultCreationCode | bytes | Creation code for the Vault |
| vaultExtensionCreationCode | bytes | Creation code for the VaultExtension |
| vaultAdminCreationCode | bytes | Creation code for the VaultAdmin |

### getDeploymentAddress

```solidity
function getDeploymentAddress(bytes32 salt) public view returns (address)
```

Gets deployment address for a given salt.

