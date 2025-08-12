# Solidity API

## FactoryWidePauseWindow

Base contract for v3 factories to support pause windows for pools based on the factory deployment time.

_Each pool deployment calls `getPauseWindowDuration` on the factory so that all Pools created by this factory
will share the same Pause Window end time, after which both old and new Pools will not be pausable.

All pools are reversibly pausable until the pause window expires. Afterward, there is an additional buffer
period, set to the same duration as the Vault's buffer period. If a pool was paused, it will remain paused
through this buffer period, and cannot be unpaused.

When the buffer period expires, it will unpause automatically, and remain permissionless forever after._

### PoolPauseWindowDurationOverflow

```solidity
error PoolPauseWindowDurationOverflow()
```

The factory deployer gave a duration that would overflow the Unix timestamp.

### constructor

```solidity
constructor(uint32 pauseWindowDuration) public
```

### getPauseWindowDuration

```solidity
function getPauseWindowDuration() external view returns (uint32)
```

Return the pause window duration. This is the time pools will be pausable after factory deployment.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | pauseWindowDuration The duration in seconds |

### getOriginalPauseWindowEndTime

```solidity
function getOriginalPauseWindowEndTime() external view returns (uint32)
```

Returns the original factory pauseWindowEndTime, regardless of the current time.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | pauseWindowEndTime The end time as a timestamp |

### getNewPoolPauseWindowEndTime

```solidity
function getNewPoolPauseWindowEndTime() public view returns (uint32)
```

Returns the current pauseWindowEndTime that will be applied to Pools created by this factory.

_We intend for all pools deployed by this factory to have the same pause window end time (i.e., after
this date, all future pools will be unpausable). This function will return `_poolsPauseWindowEndTime`
until it passes, after which it will return 0._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint32 | pauseWindowEndTime The resolved pause window end time (0 indicating it's no longer pausable) |

