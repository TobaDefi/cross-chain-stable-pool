// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IGatewayZEVM} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import {MessageContext, UniversalContract} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IZRC20, IZRC20Metadata} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";

import {UToken} from "./UToken.sol";

contract UniversalTokenSale is UniversalContract, Ownable {

    /// -------------------- Storage --------------------

    /// @notice The underlying token used in the Universal Token Sale.
    /// @dev Only UniversalTokenSale contract can mint or burn this token.
    /// @dev Price of the underlying token is 1:1 for any supported ERC-20 tokens or any Native (Gas) tokens from external chains.
    UToken public immutable UNDERLYING_TOKEN;

    /// @notice The Gateway contract address for ZetaChain Testnet
    IGatewayZEVM public constant GATEWAY = IGatewayZEVM(0x6c533f7fE93fAE114d0954697069Df33C9B74fD7);

    /// -------------------- Errors --------------------

    /// @notice Error thrown when the caller is not the Gateway contract.
    error Unauthorized();

    /// @notice Error thrown when the amount is invalid (e.g., zero or less than expected).
    /// @param amount The invalid amount that caused the error.
    error InvalidAmount(uint256 amount);

    /// -------------------- Modifiers --------------------

    modifier onlyGateway() {
        if (msg.sender != address(GATEWAY)) revert Unauthorized();
        _;
    }

    /// -------------------- Constructor --------------------

    constructor() Ownable(msg.sender) {
        UNDERLYING_TOKEN = new UToken(address(this));
    }

    /// -------------------- Functions --------------------

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata /*message*/
    ) external override onlyGateway {
        uint256 convertedAmount = _convertTokenAmount(amount, zrc20, address(UNDERLYING_TOKEN));

        if (convertedAmount == 0) {
            revert InvalidAmount(convertedAmount);
        }
        address sender = _bytesToAddress(context.sender);

        UNDERLYING_TOKEN.mint(sender, convertedAmount);
    }

    function sweep(address recipient, IZRC20 token, uint256 amount) external onlyOwner {
        if (amount > token.balanceOf(address(this))) {
            revert InvalidAmount(amount);
        }

        token.transfer(recipient, amount);
    }

    function sweepAll(address recipient, IZRC20 token) external onlyOwner {
        uint256 amount = token.balanceOf(address(this));
        if (amount == 0) {
            revert InvalidAmount(amount);
        }

        token.transfer(recipient, amount);
    }

    function _convertTokenAmount(uint256 amount, address fromToken, address toToken) internal view returns (uint256) {
        uint8 fromDecimals = IZRC20Metadata(fromToken).decimals();
        uint8 toDecimals = IZRC20Metadata(toToken).decimals();

        if (fromDecimals == toDecimals) {
            return amount;
        } else if (fromDecimals < toDecimals) {
            return amount * (10 ** (toDecimals - fromDecimals));
        } else {
            return amount / (10 ** (fromDecimals - toDecimals));
        }
    }

    function _bytesToAddress(bytes memory b) internal pure returns (address addr) {
        require(b.length == 20, "Invalid address bytes length");
        assembly {
            addr := mload(add(b, 20))
        }
    }
}
