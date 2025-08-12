# Solidity API

## BalancerPoolToken

`BalancerPoolToken` is a fully ERC20-compatible token to be used as the base contract for Balancer Pools,
with all the data and implementation delegated to the ERC20Multitoken contract.

_Implementation of the ERC-20 Permit extension allowing approvals to be made via signatures, as defined in
https://eips.ethereum.org/EIPS/eip-2612[ERC-2612]._

### PERMIT_TYPEHASH

```solidity
bytes32 PERMIT_TYPEHASH
```

### ERC2612ExpiredSignature

```solidity
error ERC2612ExpiredSignature(uint256 deadline)
```

Operation failed due to an expired permit signature.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| deadline | uint256 | The permit deadline that expired |

### ERC2612InvalidSigner

```solidity
error ERC2612InvalidSigner(address signer, address owner)
```

Operation failed due to a non-matching signature.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| signer | address | The address corresponding to the signature provider |
| owner | address | The address of the owner (expected value of the signature provider) |

### constructor

```solidity
constructor(contract IVault vault_, string bptName, string bptSymbol) public
```

### name

```solidity
function name() external view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() external view returns (string)
```

_Returns the symbol of the token._

### decimals

```solidity
function decimals() external pure returns (uint8)
```

_Returns the decimals places of the token._

### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

_Returns the value of tokens in existence._

### getVault

```solidity
function getVault() public view returns (contract IVault)
```

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_Returns the value of tokens owned by `account`._

### transfer

```solidity
function transfer(address to, uint256 amount) external returns (bool)
```

_Moves a `value` amount of tokens from the caller's account to `to`.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

_Returns the remaining number of tokens that `spender` will be
allowed to spend on behalf of `owner` through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called._

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

_Sets a `value` amount of tokens as the allowance of `spender` over the
caller's tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender's allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) external returns (bool)
```

_Moves a `value` amount of tokens from `from` to `to` using the
allowance mechanism. `value` is then deducted from the caller's
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### emitTransfer

```solidity
function emitTransfer(address from, address to, uint256 amount) external
```

_Emit the Transfer event. This function can only be called by the MultiToken._

### emitApproval

```solidity
function emitApproval(address owner, address spender, uint256 amount) external
```

_Emit the Approval event. This function can only be called by the MultiToken._

### permit

```solidity
function permit(address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public virtual
```

### incrementNonce

```solidity
function incrementNonce() external
```

Increment the sender's nonce to revoke any currently granted (but not yet executed) `permit`.

### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() external view virtual returns (bytes32)
```

### getRate

```solidity
function getRate() public view virtual returns (uint256)
```

Get the BPT rate, which is defined as: pool invariant/total supply.

_The VaultExtension contract defines a default implementation (`getBptRate`) to calculate the rate
of any given pool, which should be sufficient in nearly all cases._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | rate Rate of the pool's BPT |

