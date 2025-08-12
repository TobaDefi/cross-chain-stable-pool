# Solidity API

## Version

Retrieves a contract's version from storage.

_The version is set at deployment time and cannot be changed. It would be immutable, but immutable strings
are not yet supported.

Contracts like factories and pools should have versions. These typically take the form of JSON strings containing
detailed information about the deployment. For instance:

`{name: 'ChildChainGaugeFactory', version: 2, deployment: '20230316-child-chain-gauge-factory-v2'}`_

### constructor

```solidity
constructor(string version_) public
```

### version

```solidity
function version() external view returns (string)
```

Getter for the version.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | version The stored contract version |

### _setVersion

```solidity
function _setVersion(string newVersion) internal
```

_Internal setter that allows this contract to be used in proxies._

