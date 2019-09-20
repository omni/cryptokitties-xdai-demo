pragma solidity 0.4.24;

interface IHomeMediator {
    function handleBridgedTokens(address _recipient, uint256 _tokenId, bytes _metadata) external;
}
