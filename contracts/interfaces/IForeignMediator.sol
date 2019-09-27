pragma solidity 0.4.24;

interface IForeignMediator {
    function handleBridgedTokens(address _recipient, uint256 _tokenId, bytes32 _nonce) external;
}
