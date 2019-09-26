pragma solidity 0.4.24;

import "./BasicMediator.sol";
import "../interfaces/IHomeMediator.sol";

contract ForeignMediator is BasicMediator {
    function passMessage(address _from, uint256 _tokenId) internal {
        bytes memory metadata = getMetadata(_tokenId);

        bytes4 methodSelector = IHomeMediator(0).handleBridgedTokens.selector;
        bytes memory data = abi.encodeWithSelector(methodSelector, _from, _tokenId, metadata, nonce());

        bytes32 dataHash = keccak256(data);
        setMessageHashTokenId(dataHash, _tokenId);
        setMessageHashRecipient(dataHash, _from);
        setNonce(dataHash);

        bridgeContract().requireToPassMessage(mediatorContractOnOtherSide(), data, requestGasLimit());
    }

    function handleBridgedTokens(
        address _recipient,
        uint256 _tokenId,
        bytes32 /* _nonce */
    ) external {
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());
        erc721token().transfer(_recipient, _tokenId);
    }

    function bridgeSpecificActionsOnTokenTransfer(address _from, uint256 _tokenId) internal {
        passMessage(_from, _tokenId);
    }

    function fixFailedMessage(bytes32 _dataHash) external {
        require(msg.sender == address(bridgeContract()));
        require(bridgeContract().messageSender() == mediatorContractOnOtherSide());
        require(!messageHashFixed(_dataHash));

        address recipient = messageHashRecipient(_dataHash);
        uint256 tokenId = messageHashTokenId(_dataHash);

        setMessageHashFixed(_dataHash);
        erc721token().transfer(recipient, tokenId);

        emit FailedMessageFixed(_dataHash, recipient, tokenId);
    }
}
