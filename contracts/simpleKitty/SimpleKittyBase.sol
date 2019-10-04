pragma solidity 0.4.24;

contract SimpleKittyBase {
    /// @dev The Birth event is fired whenever a new kitten comes into existence. This obviously
    ///  includes any time a cat is created through the giveBirth method, but it is also called
    ///  when a new gen0 cat is created.
    event Birth(address owner, uint256 kittyId, uint256 matronId, uint256 sireId, uint256 genes);

    /// @dev Transfer event as defined in current draft of ERC721. Emitted every time a kitten
    ///  ownership is assigned, including births.
    event Transfer(address from, address to, uint256 tokenId);

    /*** DATA TYPES ***/

    /// @dev The main Kitty struct. Every cat in CryptoKitties is represented by a copy
    ///  of this structure, so great care was taken to ensure that it fits neatly into
    ///  exactly two 256-bit words. Note that the order of the members in this structure
    ///  is important because of the byte-packing rules used by Ethereum.
    ///  Ref: http://solidity.readthedocs.io/en/develop/miscellaneous.html
    struct Kitty {
        // The Kitty's genetic code is packed into these 256-bits, the format is
        // sooper-sekret! A cat's genes never change.
        uint256 genes;
        // The timestamp from the block when this cat came into existence.
        uint64 birthTime;
        // The minimum timestamp after which this cat can engage in breeding
        // activities again. This same timestamp is used for the pregnancy
        // timer (for matrons) as well as the siring cooldown.
        uint64 cooldownEndBlock;
        // The ID of the parents of this kitty, set to 0 for gen0 cats.
        // Note that using 32-bit unsigned integers limits us to a "mere"
        // 4 billion cats. This number might seem small until you realize
        // that Ethereum currently has a limit of about 500 million
        // transactions per year! So, this definitely won't be a problem
        // for several years (even as Ethereum learns to scale).
        uint32 matronId;
        uint32 sireId;
        // Set to the ID of the sire cat for matrons that are pregnant,
        // zero otherwise. A non-zero value here is how we know a cat
        // is pregnant. Used to retrieve the genetic material for the new
        // kitten when the birth transpires.
        uint32 siringWithId;
        // Set to the index in the cooldown array (see below) that represents
        // the current cooldown duration for this Kitty. This starts at zero
        // for gen0 cats, and is initialized to floor(generation/2) for others.
        // Incremented by one for each successful breeding action, regardless
        // of whether this cat is acting as matron or sire.
        uint16 cooldownIndex;
        // The "generation number" of this cat. Cats minted by the CK contract
        // for sale are called "gen0" and have a generation number of 0. The
        // generation number of all other cats is the larger of the two generation
        // numbers of their parents, plus one.
        // (i.e. max(matron.generation, sire.generation) + 1)
        uint16 generation;
        bool isReady;
    }

    /*** STORAGE ***/

    mapping(uint256 => Kitty) internal kitties;

    uint256 internal kittyTotalSupply;

    /// @dev A mapping from cat IDs to the address that owns them. All cats have
    ///  some valid owner address, even gen0 cats are created with a non-zero owner.
    mapping(uint256 => address) public kittyIndexToOwner;

    // @dev A mapping from owner address to count of tokens that address owns.
    //  Used internally inside balanceOf() to resolve ownership count.
    mapping(address => uint256) internal ownershipTokenCount;

    /// @dev A mapping from KittyIDs to an address that has been approved to call
    ///  transferFrom(). Each Kitty can only have one approved address for transfer
    ///  at any time. A zero value means no approval is outstanding.
    mapping(uint256 => address) public kittyIndexToApproved;

    /// @dev Assigns ownership of a specific Kitty to an address.
    function _transfer(address _from, address _to, uint256 _tokenId) internal {
        // Since the number of kittens is capped to 2^32 we can't overflow this
        ownershipTokenCount[_to]++;
        // transfer ownership
        kittyIndexToOwner[_tokenId] = _to;
        // When creating new kittens _from is 0x0, but we can't account that address.
        if (_from != address(0)) {
            ownershipTokenCount[_from]--;
            // clear any previously approved ownership exchange
            delete kittyIndexToApproved[_tokenId];
        }
        // Emit the transfer event.
        emit Transfer(_from, _to, _tokenId);
    }

    /// @dev An internal method that creates a new kitty and stores it.
    /// Receives all the data from getKitty method that was generated on Cryptokitties contract.
    /// Will generate both a Birth event and a Transfer event.
    /// @param _owner The inital owner of this cat, must be non-zero (except for the unKitty, ID 0)
    function _createKitty(
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
    ) internal returns (uint256) {
        // These requires are not strictly necessary, our calling code should make
        // sure that these conditions are never broken. However! _createKitty() is already
        // an expensive call (for storage), and it doesn't hurt to be especially careful
        // to ensure our data structures are always valid.
        require(_matronId == uint256(uint32(_matronId)));
        require(_sireId == uint256(uint32(_sireId)));
        require(_generation == uint256(uint16(_generation)));

        Kitty memory _kitty = Kitty({
            genes: _genes,
            birthTime: uint64(_birthTime),
            cooldownEndBlock: uint64(_nextActionAt),
            matronId: uint32(_matronId),
            sireId: uint32(_sireId),
            siringWithId: uint32(_siringWithId),
            cooldownIndex: uint16(_cooldownIndex),
            generation: uint16(_generation),
            isReady: _isReady
        });
        kitties[_tokenId] = _kitty;
        kittyTotalSupply++;

        // emit the birth event
        emit Birth(_owner, _tokenId, uint256(_kitty.matronId), uint256(_kitty.sireId), _kitty.genes);

        // This will assign ownership, and also emit the Transfer event as
        // per ERC721 draft
        _transfer(0, _owner, _tokenId);

        return _tokenId;
    }

    function _exists(uint256 _tokenId) internal view returns (bool) {
        return kittyIndexToOwner[_tokenId] != address(0);
    }
}
