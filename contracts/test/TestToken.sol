// SPDX-License-Identifier: MIT

pragma solidity 0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    /**
     * @notice
     * Decimals: 18
     * @dev
     * Constructor that initializes the contract with the name, symbol and decimals of the token.
     * This contract is the test token for the Eternis project. Contract has the ability free minting and burning of tokens.
     */
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(msg.sender, 10000 * 10 ** decimals());
    }

    /**
     * @notice Mints desired amount of tokens for the recipient
     * @param _receiver Receiver of the tokens.
     * @param _amount Amount (in wei - smallest decimals)
     */
    function mintFor(address _receiver, uint256 _amount) external {
        require(_receiver != address(0), "Incorrect receiver address: zero address");
        require(_amount > 0, "Incorrect amount");
        _mint(_receiver, _amount);
    }

    function mint(uint256 _amount) external {
        require(_amount > 0, "Incorrect amount");
        _mint(_msgSender(), _amount);
    }

    function burnFrom(address _account, uint256 _value) external {
        require(_account != address(0), "Incorrect receiver address: zero address");
        require(_value > 0, "Incorrect amount");
        _burn(_account, _value);
    }

    function burn(uint256 _value) external {
        require(_value > 0, "Incorrect amount");
        _burn(msg.sender, _value);
    }
}
