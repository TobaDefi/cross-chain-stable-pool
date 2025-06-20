# Solidity API

## TemplateToken

### InvalidDecimals

```solidity
error InvalidDecimals()
```

Error thrown when the decimals are invalid

_Decimals must be between 1 and 18 inclusive_

### InvalidName

```solidity
error InvalidName()
```

Error thrown when the name is invalid

_Name must be a non-empty string_

### InvalidSymbol

```solidity
error InvalidSymbol()
```

Error thrown when the symbol is invalid

_Symbol must be a non-empty string_

### constructor

```solidity
constructor(string name_, string symbol_, uint8 decimals_) public
```

Constructor that initializes the token with a name, symbol, and decimals

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name_ | string | The name of the token |
| symbol_ | string | The symbol of the token |
| decimals_ | uint8 | The number of decimals the token uses |

### mint

```solidity
function mint(address to, uint256 amount) public
```

Mints `amount` tokens to the specified `to` address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address to mint tokens to |
| amount | uint256 | The amount of tokens to mint |

### decimals

```solidity
function decimals() public view returns (uint8)
```

Decimals getter function

_This function overrides the default decimals function from ERC20_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The number of decimals the token uses |

