pragma solidity 0.4.24;

import "./SimpleKittyCore.sol";
import "../kitty/Ownable.sol";

contract SimpleBridgeKitty is Ownable, SimpleKittyCore {
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
    ) external onlyOwner {
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

    function burn(uint256 _tokenId) external onlyOwner {
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
}
