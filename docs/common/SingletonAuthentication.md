# Solidity API

## SingletonAuthentication

Base contract suitable for Singleton contracts (e.g., pool factories) that have permissioned functions.

_The disambiguator is the contract's own address. This is used in the construction of actionIds for permissioned
functions, to avoid conflicts when multiple contracts (or multiple versions of the same contract) use the same
function name._

### constructor

```solidity
constructor(contract IVault vault) internal
```

### getVault

```solidity
function getVault() public view returns (contract IVault)
```

Get the address of the Balancer Vault.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IVault | vault An interface pointer to the Vault |

### getAuthorizer

```solidity
function getAuthorizer() public view returns (contract IAuthorizer)
```

Get the address of the Authorizer.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IAuthorizer | authorizer An interface pointer to the Authorizer |

