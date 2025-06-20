// SPDX-License-Identifier: BUSL-1.1
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TemplateToken is ERC20, Ownable {
    // ---- State Variables ----

    /// @notice The number of decimals the token uses
    uint8 private immutable DECIMALS;

    // ---- Custom Errors ----

    /// @notice Error thrown when the decimals are invalid
    /// @dev Decimals must be between 1 and 18 inclusive
    error InvalidDecimals();

    /// @notice Error thrown when the name is invalid
    /// @dev Name must be a non-empty string
    error InvalidName();

    /// @notice Error thrown when the symbol is invalid
    /// @dev Symbol must be a non-empty string
    error InvalidSymbol();

    // ---- Constructor ----

    /// @notice Constructor that initializes the token with a name, symbol, and decimals
    /// @param name_ The name of the token
    /// @param symbol_ The symbol of the token
    /// @param decimals_ The number of decimals the token uses
    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) Ownable(msg.sender) {
        require(bytes(name_).length > 0, InvalidName());
        require(bytes(symbol_).length > 0, InvalidSymbol());
        require(decimals_ > 0 && decimals_ <= 18, InvalidDecimals());

        DECIMALS = decimals_;
    }

    /// @notice Mints `amount` tokens to the specified `to` address
    /// @param to The address to mint tokens to
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /// @notice Decimals getter function
    /// @return The number of decimals the token uses
    /// @dev This function overrides the default decimals function from ERC20
    function decimals() public view override returns (uint8) {
        return DECIMALS;
    }
}
