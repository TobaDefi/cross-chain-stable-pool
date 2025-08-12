# Solidity API

## VaultExtensionsLib

Ensure functions in extension contracts can only be called through the main Vault.

_The Vault is composed of three contracts, using the Proxy pattern from OpenZeppelin. `ensureVaultDelegateCall`
can be called on the locally stored Vault address by modifiers in extension contracts to ensure that their functions
can only be called through the main Vault. Because the storage *layout* is shared (through inheritance of
`VaultStorage`), but each contract actually has its own storage, we need to make sure we are always calling in the
main Vault context, to avoid referencing storage in the extension contracts._

### ensureVaultDelegateCall

```solidity
function ensureVaultDelegateCall(contract IVault vault) internal view
```

