pragma solidity 0.4.24;

import "./Initializable.sol";
import "./AMBMediator.sol";
import "./ERC721Bridge.sol";
import "./Claimable.sol";
import "./Upgradeable.sol";

contract BasicMediator is Initializable, AMBMediator, ERC721Bridge, Upgradeable, Claimable {
    event FailedMessageFixed(bytes32 indexed dataHash, address recipient, uint256 tokenId);

    bytes4 internal constant GET_KITTY = 0xe98b7f4d; // getKitty(uint256)

    function initialize(
        address _bridgeContract,
        address _mediatorContract,
        address _erc721token,
        uint256 _requestGasLimit,
        address _owner
    ) external returns (bool) {
        require(!isInitialized());

        uintStorage[DEPLOYED_AT_BLOCK] = block.number;
        _setBridgeContract(_bridgeContract);
        _setMediatorContractOnOtherSide(_mediatorContract);
        setErc721token(_erc721token);
        _setRequestGasLimit(_requestGasLimit);
        setOwner(_owner);
        setInitialize();

        return isInitialized();
    }

    function getBridgeInterfacesVersion() external pure returns (uint64 major, uint64 minor, uint64 patch) {
        return (1, 0, 0);
    }

    function getBridgeMode() external pure returns (bytes4 _data) {
        return bytes4(keccak256(abi.encodePacked("nft-to-nft-amb")));
    }

    function transferToken(uint256 _tokenId) external {
        ERC721 token = erc721token();
        address from = msg.sender;
        address to = address(this);

        token.transferFrom(from, to, _tokenId);
        bridgeSpecificActionsOnTokenTransfer(from, _tokenId);
    }

    /**
    *  getKitty(uint256) returns:
    *       bool isGestating,
    *       bool isReady,
    *       uint256 cooldownIndex,
    *       uint256 nextActionAt,
    *       uint256 siringWithId,
    *       uint256 birthTime,
    *       uint256 matronId,
    *       uint256 sireId,
    *       uint256 generation,
    *       uint256 genes
    **/
    function getMetadata(uint256 _tokenId) internal returns (bytes memory metadata) {
        bytes memory callData = abi.encodeWithSelector(GET_KITTY, _tokenId);
        address tokenAddress = erc721token();
        assembly {
            let result := callcode(gas, tokenAddress, 0x0, add(callData, 0x20), mload(callData), 0, 320)
            metadata := mload(0)

            switch result
                case 0 {
                    revert(0, 0)
                }
        }
    }

    function setMessageHashTokenId(bytes32 _hash, uint256 _tokenId) internal {
        uintStorage[keccak256(abi.encodePacked("messageHashTokenId", _hash))] = _tokenId;
    }

    function messageHashTokenId(bytes32 _hash) internal view returns (uint256) {
        return uintStorage[keccak256(abi.encodePacked("messageHashTokenId", _hash))];
    }

    function setMessageHashRecipient(bytes32 _hash, address _recipient) internal {
        addressStorage[keccak256(abi.encodePacked("messageHashRecipient", _hash))] = _recipient;
    }

    function messageHashRecipient(bytes32 _hash) internal view returns (address) {
        return addressStorage[keccak256(abi.encodePacked("messageHashRecipient", _hash))];
    }

    function setMessageHashFixed(bytes32 _hash) internal {
        boolStorage[keccak256(abi.encodePacked("messageHashFixed", _hash))] = true;
    }

    function messageHashFixed(bytes32 _hash) public view returns (bool) {
        return boolStorage[keccak256(abi.encodePacked("messageHashFixed", _hash))];
    }

    function requestFailedMessageFix(bytes32 _txHash) external {
        require(!bridgeContract().messageCallStatus(_txHash));
        require(bridgeContract().failedMessageReceiver(_txHash) == address(this));
        require(bridgeContract().failedMessageSender(_txHash) == mediatorContractOnOtherSide());
        bytes32 dataHash = bridgeContract().failedMessageDataHash(_txHash);

        bytes4 methodSelector = this.fixFailedMessage.selector;
        bytes memory data = abi.encodeWithSelector(methodSelector, dataHash);
        bridgeContract().requireToPassMessage(mediatorContractOnOtherSide(), data, requestGasLimit());
    }

    function claimTokens(address _token, address _to) public onlyIfUpgradeabilityOwner validAddress(_to) {
        claimValues(_token, _to);
    }

    function fixFailedMessage(bytes32 _dataHash) external;

    function bridgeSpecificActionsOnTokenTransfer(address _from, uint256 _tokenId) internal;
}
