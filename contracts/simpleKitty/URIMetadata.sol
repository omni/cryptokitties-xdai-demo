pragma solidity 0.4.24;

contract URIMetadata {
    function tokenURI(uint256 _tokenId) external view returns (string) {
        return strConcat("https://api.cryptokitties.co/kitties/", uintToString(_tokenId));
    }

    function uintToString(uint256 i) internal pure returns (string) {
        if (i == 0) return "0";
        uint256 j = i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length - 1;
        while (i != 0) {
            bstr[k--] = bytes1(48 + (i % 10));
            i /= 10;
        }
        return string(bstr);
    }

    function strConcat(string _a, string _b) internal pure returns (string) {
        bytes memory _ba = bytes(_a);
        bytes memory _bb = bytes(_b);
        string memory ab = new string(_ba.length + _bb.length);
        bytes memory bab = bytes(ab);
        uint256 k = 0;
        uint256 i = 0;
        for (i = 0; i < _ba.length; i++) {
            bab[k++] = _ba[i];
        }
        for (i = 0; i < _bb.length; i++) {
            bab[k++] = _bb[i];
        }
        return string(bab);
    }
}
