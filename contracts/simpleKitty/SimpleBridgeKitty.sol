pragma solidity 0.4.24;

import "./SimpleKittyCore.sol";
import "./BridgeRole.sol";
import "./URIMetadata.sol";

contract SimpleBridgeKitty is BridgeRole, SimpleKittyCore, URIMetadata {
    event Death(uint256 kittyId);

    function mint(
        uint256 _tokenId,
        bool _isReady,
        uint256 _cooldownIndex,
        uint256 _nextActionAt,
        uint256 _siringWithId,
        uint256 _birthTime,
        uint256 _matronId,
        uint256 _sireId,
        uint256 _generation,
        uint256 _genes,
        address _owner
    ) external onlyBridge {
        _createKitty(
            _tokenId,
            _isReady,
            _cooldownIndex,
            _nextActionAt,
            _siringWithId,
            _birthTime,
            _matronId,
            _sireId,
            _generation,
            _genes,
            _owner
        );
    }

    function burn(uint256 _tokenId) external onlyBridge {
        require(_owns(msg.sender, _tokenId));
        // remove kitty
        delete kitties[_tokenId];
        // reduce total supply
        kittyTotalSupply--;
        // remove ownership of the kitty
        delete kittyIndexToOwner[_tokenId];
        // reduce owner token account
        ownershipTokenCount[msg.sender]--;
        emit Death(_tokenId);
    }

    function tokenURI(uint256 _tokenId) external view returns (string) {
        require(_exists(_tokenId));
        return _tokenURI(_tokenId);
    }
}
