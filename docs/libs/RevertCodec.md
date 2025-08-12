# Solidity API

## RevertCodec

Support `quoteAndRevert`: a v2-style query which always reverts, and returns the result in the return data.

### Result

```solidity
error Result(bytes result)
```

On success of the primary operation in a `quoteAndRevert`, this error is thrown with the return data.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bytes | The result of the query operation |

### ErrorSelectorNotFound

```solidity
error ErrorSelectorNotFound()
```

Handle the "reverted without a reason" case (i.e., no return data).

### catchEncodedResult

```solidity
function catchEncodedResult(bytes resultRaw) internal pure returns (bytes)
```

### parseSelector

```solidity
function parseSelector(bytes callResult) internal pure returns (bytes4 errorSelector)
```

_Returns the first 4 bytes in an array, reverting if the length is < 4._

### bubbleUpRevert

```solidity
function bubbleUpRevert(bytes returnData) internal pure
```

_Taken from Openzeppelin's Address._

