pragma solidity 0.4.24;

import "./BasicMediator.sol";
import "../interfaces/IForeignMediator.sol";
import "../interfaces/ISimpleBridgeKitty.sol";

contract HomeMediator is BasicMediator {
    function passMessage(address _from, uint256 _tokenId, bytes _metadata) internal {
        bytes4 methodSelector = IForeignMediator(0).handleBridgedTokens.selector;
        bytes memory data = abi.encodeWithSelector(methodSelector, _from, _tokenId);

        bytes32 dataHash = keccak256(data);
        setMessageHashTokenId(dataHash, _tokenId);
        setMessageHashRecipient(dataHash, _from);
        setMessageHashMetadata(dataHash, _metadata);

        bridgeContract().requireToPassMessage(mediatorContractOnOtherSide(), data, requestGasLimit());
    }

    function handleBridgedTokens(address _recipient, uint256 _tokenId, bytes _metadata) external {
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());

        mintToken(_recipient, _tokenId, _metadata);
    }

    function mintToken(address _recipient, uint256 _tokenId, bytes _metadata) internal {
        ISimpleBridgeKitty(erc721token()).mint(
            _tokenId,
            getMetadataBoolValue(_metadata, 2), // isReady
            getMetadataUintValue(_metadata, 3), // cooldownIndex
            getMetadataUintValue(_metadata, 4), // nextActionAt
            getMetadataUintValue(_metadata, 5), // siringWithId
            getMetadataUintValue(_metadata, 6), // birthTime
            getMetadataUintValue(_metadata, 7), // matronId
            getMetadataUintValue(_metadata, 8), // sireId
            getMetadataUintValue(_metadata, 9), // generation
            getMetadataUintValue(_metadata, 10), // genes
            _recipient
        );
    }

    function bridgeSpecificActionsOnTokenTransfer(address _from, uint256 _tokenId) internal {
        bytes memory metadata = getMetadata(_tokenId);

        ISimpleBridgeKitty(erc721token()).burn(_tokenId);
        passMessage(_from, _tokenId, metadata);
    }

    function getMetadataUintValue(bytes _data, uint256 _index) internal pure returns (uint256 value) {
        uint256 offset = 32 * _index;
        assembly {
            value := mload(add(_data, offset))
        }
    }

    function getMetadataBoolValue(bytes _data, uint256 _index) internal pure returns (bool value) {
        uint256 offset = 32 * _index;
        assembly {
            value := mload(add(_data, offset))
        }
    }

    function setMessageHashMetadata(bytes32 _hash, bytes _metadata) internal {
        bytesStorage[keccak256(abi.encodePacked("messageHashMetadata", _hash))] = _metadata;
    }

    function messageHashMetadata(bytes32 _hash) internal view returns (bytes) {
        return bytesStorage[keccak256(abi.encodePacked("messageHashMetadata", _hash))];
    }

    function fixFailedMessage(bytes32 _dataHash) external {
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());
        require(!messageHashFixed(_dataHash));

        address recipient = messageHashRecipient(_dataHash);
        uint256 tokenId = messageHashTokenId(_dataHash);
        bytes memory metadata = messageHashMetadata(_dataHash);

        setMessageHashFixed(_dataHash);
        mintToken(recipient, tokenId, metadata);

        emit FailedMessageFixed(_dataHash, recipient, tokenId);
    }
}
