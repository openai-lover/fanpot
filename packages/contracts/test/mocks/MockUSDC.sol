// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    enum Mode { Normal, FalseReturn, RevertTransfer, BadDelta, NoReturn, Reenter }
    Mode public mode;
    uint8 private tokenDecimals = 6;
    address public callbackTarget;
    bytes public callbackData;
    bool public callbackSucceeded;
    constructor() ERC20("Test USDC", "USDC") {}
    function decimals() public view override returns (uint8) { return tokenDecimals; }
    function setDecimals(uint8 value) external { tokenDecimals = value; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
    function setMode(Mode value) external { mode = value; }
    function setCallback(address target, bytes calldata data) external { callbackTarget = target; callbackData = data; }
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (mode == Mode.FalseReturn) return false;
        if (mode == Mode.RevertTransfer) revert("blocked");
        bool ok = super.transfer(to, amount);
        if (mode == Mode.Reenter) (callbackSucceeded,) = callbackTarget.call(callbackData);
        if (mode == Mode.NoReturn) assembly { return(0, 0) }
        return ok;
    }
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (mode == Mode.FalseReturn) return false;
        if (mode == Mode.RevertTransfer) revert("blocked");
        bool ok = super.transferFrom(from, to, mode == Mode.BadDelta ? amount - 1 : amount);
        if (mode == Mode.Reenter) (callbackSucceeded,) = callbackTarget.call(callbackData);
        if (mode == Mode.NoReturn) assembly { return(0, 0) }
        return ok;
    }
}
