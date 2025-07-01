// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IGatewayZEVM} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import {MessageContext, UniversalContract} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {IZRC20, IZRC20Metadata} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {UToken} from "./UToken.sol";

contract UniversalTokenSale is UniversalContract, Ownable {
    /// -------------------- Types --------------------

    /// @notice Parameters for the revert message when a revert triggers on the destination chain.
    struct RevertMessageParams {
        address sender;
        address gasZRC20;
        uint256 gasFee;
        uint256 out;
    }

    /// -------------------- Storage --------------------

    /// @notice The underlying token used in the Universal Token Sale.
    /// @dev Only UniversalTokenSale contract can mint or burn this token.
    /// @dev Price of the underlying token is 1:1 for any supported ERC-20 tokens or any Native (Gas) tokens from external chains.
    UToken public immutable UNDERLYING_TOKEN;

    /// @notice The Gateway contract address for ZetaChain Testnet
    IGatewayZEVM public constant GATEWAY = IGatewayZEVM(0x6c533f7fE93fAE114d0954697069Df33C9B74fD7);

    /// @notice The Uniswap V2 Router contract address for ZetaChain Testnet
    /// @dev This router is used to swap tokens in the Universal Token Sale.
    address public constant UNISWAP_ROUTER = 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe;

    /// @notice The gas limit for the onRevert function.
    uint256 public constant GAS_LIMIT = 5000000;

    /// @notice The address of the Wrapped Zeta token (WZeta) on ZetaChain Testnet.
    address public WZeta; // Wrapped Zeta token address

    /// -------------------- Errors --------------------

    /// @notice Error thrown when the caller is not the Gateway contract.
    error Unauthorized();

    /// @notice Error thrown when the amount is invalid (e.g., zero or less than expected).
    /// @param amount The invalid amount that caused the error.
    error InvalidAmount(uint256 amount);

    /// @notice Error thrown when the amount is insufficient for a specific operation.
    /// @param message A descriptive message explaining the reason for the error.
    error InsufficientAmount(string message);

    /// @notice Error thrown when the approval of a token transfer fails.
    error ApprovalFailed();

    /// -------------------- Events --------------------

    /// @notice Event emitted when a token swap occurs in the Universal Token Sale.
    event TokenSwap(
        address sender,
        address indexed recipient,
        address indexed inputToken,
        address indexed targetToken,
        uint256 inputAmount,
        uint256 outputAmount
    );

    /// @notice Event emitted when a user buys UToken in the Universal Token Sale.
    event SaleUToken(
        address indexed seller,
        uint256 uTokenAmount,
        address targetToken,
        uint256 outputAmount,
        uint256 gasFee
    );

    /// @notice Event emitted when a user buys UToken in the Universal Token Sale.
    event BuyUToken(
        address indexed buyer,
        address externalPaymentToken,
        uint256 externalPaymentAmount,
        address paymentToken,
        uint256 paymentAmount,
        uint256 uTokenAmount
    );

    /// -------------------- Modifiers --------------------

    /// @notice Modifier that restricts access to the Gateway contract.
    modifier onlyGateway() {
        if (msg.sender != address(GATEWAY)) revert Unauthorized();
        _;
    }

    /// -------------------- Constructor --------------------

    constructor() Ownable(msg.sender) {
        // Deploy the underlying token contract
        UNDERLYING_TOKEN = new UToken(address(this));

        // Set the WZeta address using the Uniswap V2 Router
        WZeta = IUniswapV2Router02(UNISWAP_ROUTER).WETH(); // WETH() -> WZeta()
    }

    /// -------------------- Functions --------------------

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata /*message*/
    ) external override onlyGateway {
        address sender = _bytesToAddress(context.sender);
        uint256 paymentAmount = amount;

        if (zrc20 != WZeta) {
            paymentAmount = SwapHelperLib.swapExactTokensForTokens(UNISWAP_ROUTER, zrc20, amount, WZeta, 0);
            // Emit the TokenSwap event for the debugging purpose

            emit TokenSwap(address(this), address(this), zrc20, WZeta, amount, paymentAmount);
        }

        uint256 convertedAmount = _convertTokenAmount(paymentAmount, WZeta, address(UNDERLYING_TOKEN));

        if (convertedAmount == 0) {
            revert InvalidAmount(convertedAmount);
        }

        UNDERLYING_TOKEN.mint(sender, convertedAmount);

        emit BuyUToken(sender, zrc20, amount, WZeta, paymentAmount, convertedAmount);
    }

    function saleUToken(uint256 amount, address targetToken) external {
        if (amount == 0) {
            revert InvalidAmount(amount);
        }
        address sender = msg.sender;

        UNDERLYING_TOKEN.burn(sender, amount);

        (uint256 out, address gasZRC20, uint256 gasFee) = handleGasAndSwap(WZeta, amount, targetToken);
        // Emit the TokenSwap event for the debugging purpose
        emit TokenSwap(address(this), address(this), WZeta, targetToken, amount, out);

        if (out == 0) {
            revert InvalidAmount(out);
        }

        withdraw(abi.encodePacked(sender), gasFee, gasZRC20, out);

        emit SaleUToken(sender, amount, targetToken, out, gasFee);
    }

    function saleUToken(uint256 amount) external {
        if (amount == 0) {
            revert InvalidAmount(amount);
        }
        address sender = msg.sender;

        UNDERLYING_TOKEN.burn(sender, amount);

        IZRC20(WZeta).transfer(sender, amount);

        emit SaleUToken(sender, amount, WZeta, amount, 0);
    }

    /**
     * @notice Transfer tokens to the recipient on ZetaChain or withdraw to a connected chain
     */
    function withdraw(bytes memory sender, uint256 gasFee, address gasZRC20, uint256 out) internal {
        if (!IZRC20(gasZRC20).approve(address(GATEWAY), out + gasFee)) {
            revert ApprovalFailed();
        }

        RevertMessageParams memory params = RevertMessageParams({
            sender: _bytesToAddress(sender),
            gasZRC20: gasZRC20,
            gasFee: gasFee,
            out: out
        });

        GATEWAY.withdraw(
            sender,
            out,
            gasZRC20,
            RevertOptions({
                revertAddress: address(this),
                callOnRevert: true,
                abortAddress: address(0),
                revertMessage: abi.encode(params),
                onRevertGasLimit: GAS_LIMIT
            })
        );
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

    /**
     * @notice Swaps enough tokens to pay gas fees, then swaps the remainder to the target token
     */
    function handleGasAndSwap(
        address inputToken,
        uint256 amount,
        address targetToken
    ) internal returns (uint256, address, uint256) {
        uint256 inputForGas;
        uint256 swapAmount = amount;

        (address gasZRC20, uint256 gasFee) = IZRC20(targetToken).withdrawGasFee();
        uint256 minInput = quoteMinInput(inputToken, targetToken);
        if (amount < minInput) {
            revert InsufficientAmount(
                "The input amount is less than the min amount required to cover the withdraw gas fee"
            );
        }
        if (gasZRC20 == inputToken) {
            swapAmount = amount - gasFee;
        } else {
            inputForGas = SwapHelperLib.swapTokensForExactTokens(UNISWAP_ROUTER, inputToken, gasFee, gasZRC20, amount);
            swapAmount = amount - inputForGas;
        }

        uint256 out = SwapHelperLib.swapExactTokensForTokens(UNISWAP_ROUTER, inputToken, swapAmount, targetToken, 0);
        return (out, gasZRC20, gasFee);
    }

    /**
     * @notice Returns the minimum amount of input tokens required to cover the gas fee for withdrawal
     */
    function quoteMinInput(address inputToken, address targetToken) public view returns (uint256) {
        (address gasZRC20, uint256 gasFee) = IZRC20(targetToken).withdrawGasFee();

        if (inputToken == gasZRC20) {
            return gasFee;
        }

        address[] memory path;
        if (inputToken == WZeta || gasZRC20 == WZeta) {
            path = new address[](2);
            path[0] = inputToken;
            path[1] = gasZRC20;
        } else {
            path = new address[](3);
            path[0] = inputToken;
            path[1] = WZeta;
            path[2] = gasZRC20;
        }

        uint256[] memory amountsIn = IUniswapV2Router02(UNISWAP_ROUTER).getAmountsIn(gasFee, path);

        return amountsIn[0];
    }

    /**
     * @notice onRevert handles an edge-case when a swap fails when the recipient
     * on the destination chain is a contract that cannot accept tokens.
     */
    function onRevert(RevertContext calldata context) external onlyGateway {
        RevertMessageParams memory params = abi.decode(context.revertMessage, (RevertMessageParams));

        address senderAddress = params.sender;
        uint256 amount = params.gasFee + params.out;

        uint256 currentBalance = IZRC20(params.gasZRC20).balanceOf(address(this));
        if (currentBalance < amount) {
            amount = currentBalance;
        }

        IZRC20(params.gasZRC20).transfer(senderAddress, amount);
    }
}
