// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IGatewayZEVM} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import {MessageContext, UniversalContract} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import {RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {IZRC20, IZRC20Metadata} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract HelperContract is UniversalContract, Ownable {
    /// -------------------- Storage --------------------

    /// @notice The Gateway contract address for ZetaChain Testnet
    IGatewayZEVM public constant GATEWAY = IGatewayZEVM(0x6c533f7fE93fAE114d0954697069Df33C9B74fD7);

    /// @notice The Uniswap V2 Router contract address for ZetaChain Testnet
    /// @dev This router is used to swap tokens in the Universal Token Sale.
    IUniswapV2Router02 public constant UNISWAP_ROUTER = IUniswapV2Router02(0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe);

    /// @notice The gas limit for the onRevert function.
    uint256 public constant GAS_LIMIT = 5000000;

    /// @notice Flag to check the balance before sweeping tokens.
    bool private _checkBalance = true;

    /// -------------------- Errors --------------------

    /// @notice Error thrown when the caller is not the Gateway contract.
    error NotGateway();

    /// @notice Error thrown when the amount is zero.
    error ZeroAmount();

    /// @notice Error thrown when the recipient or token address is zero.
    error ZeroAddress();

    /// @notice Error thrown when the amount is insufficient for a specific operation.
    /// @param token The address of the token for which the amount is insufficient.
    /// @param amount The amount that was attempted to be used.
    error InsufficientAmount(address token, uint256 amount);

    /// @notice Error thrown when the approval of a token transfer fails.
    /// @param token The address of the token for which the approval failed.
    /// @param amount The amount that was attempted to be approved.
    error ApprovalFailed(address token, uint256 amount);

    /// @notice Error thrown when the gas fee amount is insufficient for withdrawal.
    error InsufficientWithdrawGasFeeAmount();

    /// @notice Error thrown when the transfer of tokens fails.
    error TransferFailed(address token, uint256 amount);

    /// -------------------- Events --------------------

    /// @notice Event emitted when an amount of tokens is transferred from an external chain.
    event TransferAmountIn(address indexed sender, address indexed recipient, address indexed token, uint256 amountIn);

    /// @notice Event emitted when an amount of tokens is transferred to an external chain.
    event TransferAmountOut(
        address indexed sender,
        address indexed recipient,
        address indexed targetToken,
        address gasToken,
        uint256 amountOut,
        uint256 gasFee
    );

    /// -------------------- Modifiers --------------------

    /// @notice Modifier that restricts access to the Gateway contract.
    modifier onlyGateway() {
        if (msg.sender != address(GATEWAY)) revert NotGateway();
        _;
    }

    /// -------------------- Constructor --------------------

    constructor() Ownable(msg.sender) {}

    /// -------------------- Functions --------------------

    /**
     * @notice Handles incoming calls from the Gateway contract.
     * @param context The message context containing sender information.
     * @param zrc20 The ZRC20 token address to transfer.
     * @param amount The amount of the ZRC20 token to transfer.
     * @param message Additional data sent with the call.
     * @dev This function transfers the specified amount of ZRC20 tokens to the recipient.
     */
    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        address recipient = context.senderEVM;

        if (message.length != 0) {
            address decodedRecipient = abi.decode(message, (address));
            if (decodedRecipient != address(0)) {
                recipient = decodedRecipient;
            }
        }

        IZRC20(zrc20).transfer(recipient, amount);

        emit TransferAmountIn(context.senderEVM, recipient, zrc20, amount);
    }

    /**
     * @notice Transfers tokens to the destination chain.
     * @param recipient The address to receive the tokens on the destination chain.
     * @param token The token to transfer.
     * @param amount The amount of tokens to transfer.
     * @dev This function transfers the specified amount of tokens from the sender to the contract,
     * then withdraws them to the destination chain using the Gateway contract.
     */
    function transferToDestinationChain(address recipient, address token, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        if (recipient == address(0) || token == address(0)) revert ZeroAddress();

        address sender = msg.sender;

        if (!IZRC20(token).transferFrom(sender, address(this), amount)) {
            revert TransferFailed(token, amount);
        }

        (uint256 amountOut, address gasZRC20, uint256 gasFee) = _handleGasAndSwap(amount, token);

        _withdraw(recipient, token, amountOut, gasZRC20, gasFee);

        emit TransferAmountOut(sender, recipient, token, gasZRC20, amountOut, gasFee);
    }

    /**
     * @notice Sweeps a specific amount of tokens from the contract to the recipient.
     * @param recipient The address to receive the tokens.
     * @param token The token to sweep.
     * @param amount The amount of tokens to sweep.
     * @dev Only the owner can call this function.
     */
    function sweep(address recipient, address token, uint256 amount) public onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();

        if (token == address(0)) {
            if (_checkBalance && amount > address(this).balance) {
                revert InsufficientAmount(token, amount);
            }

            (bool success, ) = recipient.call{value: amount}("");
            if (!success) revert TransferFailed(token, amount);
        } else {
            if (_checkBalance && amount > IZRC20(token).balanceOf(address(this))) {
                revert InsufficientAmount(token, amount);
            }

            IZRC20(token).transfer(recipient, amount);
        }
    }

    /**
     * @notice Sweeps all tokens of a specific type from the contract to the recipient.
     * @param recipient The address to receive the tokens.
     * @param token The token to sweep.
     * @dev Only the owner can call this function.
     */
    function sweepAll(address recipient, address token) external onlyOwner returns (uint256 amount) {
        if (token == address(0)) {
            amount = address(this).balance;
        } else {
            amount = IZRC20(token).balanceOf(address(this));
        }
        _checkBalance = false;
        sweep(recipient, token, amount);
        _checkBalance = true;
    }

    /**
     * @notice Transfer tokens to the recipient on ZetaChain or withdraw to a connected chain
     */
    function _withdraw(address sender, address targetToken, uint256 out, address gasZRC20, uint256 gasFee) internal {
        if (gasZRC20 == targetToken) {
            if (!IZRC20(gasZRC20).approve(address(GATEWAY), (out + gasFee))) {
                revert ApprovalFailed(gasZRC20, (out + gasFee));
            }
        } else {
            if (!IZRC20(gasZRC20).approve(address(GATEWAY), gasFee)) {
                revert ApprovalFailed(gasZRC20, gasFee);
            }
            if (!IZRC20(targetToken).approve(address(GATEWAY), out)) {
                revert ApprovalFailed(targetToken, out);
            }
        }

        GATEWAY.withdraw(
            abi.encodePacked(sender),
            out,
            targetToken,
            RevertOptions({
                revertAddress: address(0),
                callOnRevert: false,
                abortAddress: address(0),
                revertMessage: "0x",
                onRevertGasLimit: GAS_LIMIT
            })
        );
    }

    /**
     * @notice Swaps enough tokens to pay gas fees, then swaps the remainder to the target token
     */
    function _handleGasAndSwap(
        uint256 amount,
        address targetToken
    ) internal returns (uint256 amountOut, address gasZRC20, uint256 gasFee) {
        (gasZRC20, gasFee) = IZRC20(targetToken).withdrawGasFee();

        //NOTE: If the target token is the gas ZRC20, we can use it directly.
        if (targetToken == gasZRC20) {
            if (amount < gasFee) {
                revert InsufficientWithdrawGasFeeAmount();
            }
            amountOut = amount - gasFee;
        } else {
            // NOTE: If the target token is not the gas ZRC20, we need to swap.
            address wZeta = UNISWAP_ROUTER.WETH();
            address[] memory path = new address[](3);

            path = new address[](3);
            path[0] = targetToken;
            path[1] = wZeta;
            path[2] = gasZRC20;

            uint256[] memory amountsIn = UNISWAP_ROUTER.getAmountsIn(gasFee, path);

            if (amount < amountsIn[0]) {
                revert InsufficientWithdrawGasFeeAmount();
            }

            uint256 inputForGas = SwapHelperLib.swapTokensForExactTokens(
                address(UNISWAP_ROUTER),
                targetToken,
                gasFee,
                gasZRC20,
                amount
            );

            amountOut = amount - inputForGas;
        }
    }
}
