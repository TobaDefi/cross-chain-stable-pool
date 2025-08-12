# Solidity API

## EVMCallModeHelpers

Library used to check whether the current operation was initiated through a static call.

### NotStaticCall

```solidity
error NotStaticCall()
```

A state-changing transaction was initiated in a context that only allows static calls.

### isStaticCall

```solidity
function isStaticCall() internal view returns (bool)
```

_Detects whether the current transaction is a static call.
A static call is one where `tx.origin` equals 0x0 for most implementations.
See this tweet for a table on how transaction parameters are set on different platforms:
https://twitter.com/0xkarmacoma/status/1493380279309717505

Solidity eth_call reference docs are here: https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_call_

