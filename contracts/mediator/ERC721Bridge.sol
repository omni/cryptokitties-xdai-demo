pragma solidity 0.4.24;

import "../kitty/ERC721.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "../upgradeability/EternalStorage.sol";

contract ERC721Bridge is EternalStorage {
    bytes32 internal constant ERC721_TOKEN = keccak256(abi.encodePacked("erc721token"));

    function erc721token() public view returns (ERC721) {
        return ERC721(addressStorage[ERC721_TOKEN]);
    }

    function setErc721token(address _token) internal {
        require(AddressUtils.isContract(_token));
        addressStorage[ERC721_TOKEN] = _token;
    }
}
