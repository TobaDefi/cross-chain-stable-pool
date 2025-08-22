// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract OwnableTestToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000;

    /**
     * @notice
     * Decimals: 18
     * @dev
     * Constructor that initializes the contract with the name, symbol and decimals of the token.
     * This contract is the test token for the Eternis project. Contract has the ability free minting and burning of tokens.
     */
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY * 10 ** decimals());
    }

    function mint(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Incorrect amount");
        _mint(_msgSender(), _amount);
    }
}
