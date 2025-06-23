// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IGatewayZEVM} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import {MessageContext, UniversalContract} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import {IZRC20} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract UniversalTreasury is UniversalContract, Ownable {
    /// @notice The Gateway contract address for ZetaChain Testnet
    IGatewayZEVM public constant GATEWAY = IGatewayZEVM(0x6c533f7fE93fAE114d0954697069Df33C9B74fD7);

    uint256 constant BNB_TESTNET = 97;
    uint256 constant ETH_TESTNET = 11155111;

    /// @notice The base token contract address, which is a ZRC20 token
    IZRC20 public constant BASE_TOKEN = IZRC20(0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891);

    mapping(address user => uint balance) private _balances;

    event Deposit(address indexed user, uint256 amount);

    error Unauthorized();

    error UnsupportedChainID(uint256 chainID);

    error UnsupportedToken(address token);

    error InvalidAmount(uint256 amount);

    modifier onlyGateway() {
        if (msg.sender != address(GATEWAY)) revert Unauthorized();
        _;
    }

    constructor() Ownable(msg.sender) {}

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        if (context.chainID != BNB_TESTNET && context.chainID != ETH_TESTNET) {
            revert UnsupportedChainID(context.chainID);
        }

        if (zrc20 != address(BASE_TOKEN)) {
            revert UnsupportedToken(zrc20);
        }
        (address _user, uint256 _amount) = abi.decode(message, (address, uint256));

        if (amount == 0 && amount != _amount) {
            revert InvalidAmount(amount);
        }

        _deposit(_user, _amount);
    }

    function _deposit(address user, uint256 amount) internal onlyGateway {
        BASE_TOKEN.transferFrom(msg.sender, address(this), amount);

        _balances[user] += amount;
        emit Deposit(user, amount);
    }

    function balanceOf(address user) external view returns (uint) {
        return _balances[user];
    }

    function sweep(address recipient, uint256 amount) external onlyOwner {
        if (amount > BASE_TOKEN.balanceOf(address(this))) {
            revert InvalidAmount(amount);
        }

        BASE_TOKEN.transfer(recipient, amount);
    }

    function sweepAll(address recipient) external onlyOwner {
        uint256 amount = BASE_TOKEN.balanceOf(address(this));
        if (amount == 0) {
            revert InvalidAmount(amount);
        }

        BASE_TOKEN.transfer(recipient, amount);
    }
}
