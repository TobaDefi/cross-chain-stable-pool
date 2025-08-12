# Solidity API

## ERC20MultiToken

Store Token data and handle accounting for pool tokens in the Vault.

_The ERC20MultiToken is an ERC20-focused multi-token implementation that is fully compatible with the ERC20 API
on the token side. It also allows for the minting and burning of tokens on the multi-token side._

### _POOL_MINIMUM_TOTAL_SUPPLY

```solidity
uint256 _POOL_MINIMUM_TOTAL_SUPPLY
```

### Transfer

```solidity
event Transfer(address pool, address from, address to, uint256 value)
```

Pool tokens are moved from one account (`from`) to another (`to`). Note that `value` may be zero.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool token being transferred |
| from | address | The token source |
| to | address | The token destination |
| value | uint256 | The number of tokens |

### Approval

```solidity
event Approval(address pool, address owner, address spender, uint256 value)
```

The allowance of a `spender` for an `owner` is set by a call to {approve}. `value` is the new allowance.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The pool token receiving the allowance |
| owner | address | The token holder |
| spender | address | The account being authorized to spend a given amount of the token |
| value | uint256 | The number of tokens spender is authorized to transfer from owner |

### _totalSupply

```solidity
function _totalSupply(address pool) internal view returns (uint256)
```

### _balanceOf

```solidity
function _balanceOf(address pool, address account) internal view returns (uint256)
```

### _allowance

```solidity
function _allowance(address pool, address owner, address spender) internal view returns (uint256)
```

### _queryModeBalanceIncrease

```solidity
function _queryModeBalanceIncrease(address pool, address to, uint256 amount) internal
```

_DO NOT CALL THIS METHOD!
Only `removeLiquidity` in the Vault may call this - in a query context - to allow burning tokens the caller
does not have._

### _mint

```solidity
function _mint(address pool, address to, uint256 amount) internal
```

### _ensurePoolMinimumTotalSupply

```solidity
function _ensurePoolMinimumTotalSupply(uint256 newTotalSupply) internal pure
```

### _mintMinimumSupplyReserve

```solidity
function _mintMinimumSupplyReserve(address pool) internal
```

### _burn

```solidity
function _burn(address pool, address from, uint256 amount) internal
```

### _transfer

```solidity
function _transfer(address pool, address from, address to, uint256 amount) internal
```

### _approve

```solidity
function _approve(address pool, address owner, address spender, uint256 amount) internal
```

### _spendAllowance

```solidity
function _spendAllowance(address pool, address owner, address spender, uint256 amount) internal
```

