# Solidity API

## BasePoolAuthentication

_Base contract for performing access control on external functions within pools._

### constructor

```solidity
constructor(contract IVault vault, address factory) internal
```

_Pools should use the pool factory as the disambiguator passed into the base Authentication contract.
Otherwise, permissions would conflict if different pools reused function names._

