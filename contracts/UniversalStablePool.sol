// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IGatewayZEVM} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import {MessageContext, UniversalContract} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract UniversalStablePool is UniversalContract, Ownable {
    /// -------------------- Types --------------------

    struct AddLiquidityParams {
        address zrc20; // The ZRC20 token address to add liquidity for
        uint256 amount; // The amount of the ZRC20 token to add as liquidity
    }

    struct RemoveLiquidityParams {
        address zrc20; // The ZRC20 token address to remove liquidity for
        uint256 amount; // The amount of the ZRC20 token to remove as liquidity
    }

    /// -------------------- Storage --------------------

    /// @notice The Gateway contract address for ZetaChain Testnet
    /// @dev todo: change to address initialization from the constructor
    IGatewayZEVM public constant GATEWAY = IGatewayZEVM(0x6c533f7fE93fAE114d0954697069Df33C9B74fD7);

    /// -------------------- Errors --------------------

    /// @notice Error thrown when the caller is not the Gateway contract.
    error Unauthorized();

    /// -------------------- Events --------------------

    /// @notice Event emitted when liquidity is added to the pool.
    /// @dev todo: add more details to the event if needed or change the event signature
    event LiquidityAdded(address indexed sender, address indexed zrc20, uint256 amount);

    /// @notice Event emitted when liquidity is removed from the pool.
    /// @dev todo: add more details to the event if needed or change the event signature
    event LiquidityRemoved(address indexed sender, address indexed zrc20, uint256 amount, bool withdrawFlag);

    /// -------------------- Modifiers --------------------

    /// @notice Modifier that restricts access to the Gateway contract.
    modifier onlyGateway() {
        if (msg.sender != address(GATEWAY)) revert Unauthorized();
        _;
    }

    /// -------------------- Constructor --------------------

    /// @dev todo: change to constructor in the future
    constructor() Ownable(msg.sender) {}

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata /*message*/
    ) external override onlyGateway {
        address sender = _bytesToAddress(context.sender);
        // todo: implement the logic to handle the incoming call from the Gateway
        _addLiquidity(sender, AddLiquidityParams({zrc20: zrc20, amount: amount}));
    }

    function addLiquidity(AddLiquidityParams memory params) external {
        // todo: implement the logic to add liquidity to the pool
        _addLiquidity(msg.sender, params);
    }

    function removeLiquidity(RemoveLiquidityParams memory params, bool withdrawFlag) external {
        // todo: implement the logic to remove liquidity from the pool
        if (withdrawFlag) {
            // todo: implement the logic to withdraw the removed liquidity
        }

        emit LiquidityRemoved(msg.sender, params.zrc20, params.amount, withdrawFlag);
    }

    function _addLiquidity(address sender, AddLiquidityParams memory params) internal {
        // todo: implement the logic to add liquidity to the pool
        emit LiquidityAdded(sender, params.zrc20, params.amount);
    }

    

    function _bytesToAddress(bytes memory b) internal pure returns (address addr) {
        require(b.length == 20, "Invalid address bytes length");
        assembly {
            addr := mload(add(b, 20))
        }
    }
}
