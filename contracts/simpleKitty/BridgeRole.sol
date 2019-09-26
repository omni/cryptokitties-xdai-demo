pragma solidity 0.4.24;

contract BridgeRole {
    address public bridge;

    function BridgeRole() public {
        bridge = msg.sender;
    }

    modifier onlyBridge() {
        require(msg.sender == bridge);
        _;
    }

    function transferBridgeRole(address newBridge) external onlyBridge {
        if (newBridge != address(0)) {
            bridge = newBridge;
        }
    }
}
