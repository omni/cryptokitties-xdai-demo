pragma solidity 0.4.24;

import "../../bridge-contracts/contracts/upgradeability/EternalStorage.sol";
import "../../bridge-contracts/contracts/interfaces/IAMB.sol";
import "../../bridge-contracts/contracts/upgradeable_contracts/Ownable.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";

contract AMBMediator is EternalStorage, Ownable {
    bytes32 internal constant BRIDGE_CONTRACT = keccak256(abi.encodePacked("bridgeContract"));
    bytes32 internal constant MEDIATOR_CONTRACT = keccak256(abi.encodePacked("mediatorContract"));
    bytes32 internal constant REQUEST_GAS_LIMIT = keccak256(abi.encodePacked("requestGasLimit"));

    function setBridgeContract(address _bridgeContract) external onlyOwner {
        _setBridgeContract(_bridgeContract);
    }

    function _setBridgeContract(address _bridgeContract) internal {
        require(AddressUtils.isContract(_bridgeContract));
        addressStorage[BRIDGE_CONTRACT] = _bridgeContract;
    }

    function bridgeContract() public view returns (IAMB) {
        return IAMB(addressStorage[BRIDGE_CONTRACT]);
    }

    function setMediatorContractOnOtherSide(address _mediatorContract) external onlyOwner {
        _setMediatorContractOnOtherSide(_mediatorContract);
    }

    function _setMediatorContractOnOtherSide(address _mediatorContract) internal {
        addressStorage[MEDIATOR_CONTRACT] = _mediatorContract;
    }

    function mediatorContractOnOtherSide() public view returns (address) {
        return addressStorage[MEDIATOR_CONTRACT];
    }

    function setRequestGasLimit(uint256 _requestGasLimit) external onlyOwner {
        _setRequestGasLimit(_requestGasLimit);
    }

    function _setRequestGasLimit(uint256 _requestGasLimit) internal {
        require(_requestGasLimit <= bridgeContract().maxGasPerTx());
        uintStorage[REQUEST_GAS_LIMIT] = _requestGasLimit;
    }

    function requestGasLimit() public view returns (uint256) {
        return uintStorage[REQUEST_GAS_LIMIT];
    }
}
