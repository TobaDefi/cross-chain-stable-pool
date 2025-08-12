# Solidity API

## VaultStateBits

## VaultStateLib

Helper functions for reading and writing the `VaultState` struct.

### QUERY_DISABLED_OFFSET

```solidity
uint256 QUERY_DISABLED_OFFSET
```

### VAULT_PAUSED_OFFSET

```solidity
uint256 VAULT_PAUSED_OFFSET
```

### BUFFER_PAUSED_OFFSET

```solidity
uint256 BUFFER_PAUSED_OFFSET
```

### isQueryDisabled

```solidity
function isQueryDisabled(VaultStateBits config) internal pure returns (bool)
```

### setQueryDisabled

```solidity
function setQueryDisabled(VaultStateBits config, bool value) internal pure returns (VaultStateBits)
```

### isVaultPaused

```solidity
function isVaultPaused(VaultStateBits config) internal pure returns (bool)
```

### setVaultPaused

```solidity
function setVaultPaused(VaultStateBits config, bool value) internal pure returns (VaultStateBits)
```

### areBuffersPaused

```solidity
function areBuffersPaused(VaultStateBits config) internal pure returns (bool)
```

### setBuffersPaused

```solidity
function setBuffersPaused(VaultStateBits config, bool value) internal pure returns (VaultStateBits)
```

