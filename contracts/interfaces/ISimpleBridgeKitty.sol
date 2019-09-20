pragma solidity 0.4.24;

interface ISimpleBridgeKitty {
    function Mint(
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
    ) external;
    function Burn(uint256 _tokenId) external;
}
