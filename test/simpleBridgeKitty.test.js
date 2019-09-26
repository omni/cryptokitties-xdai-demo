const SimpleBridgeKitty = artifacts.require('SimpleBridgeKitty.sol')

const { expectRevert, expectEvent, BN, constants } = require('openzeppelin-test-helpers')
const { expect } = require('chai')

const kittyId = 1
const isReady = true
const cooldownIndex = 0
const nextActionAt = 2
const siringWithId = 3
const birthTime = 1511417999
const matronId = 4
const sireId = 5
const generation = 6
const genes = '623494533466173608148163391622294272936404886827521876326676079749575115'

contract('SimpleBridgeKitty', accounts => {
  let token
  const owner = accounts[0]
  const user = accounts[1]

  beforeEach(async () => {
    token = await SimpleBridgeKitty.new()
  })
  describe('mint', () => {
    it('should mint with token Id and metadata', async () => {
      // Given
      expect(await token.bridge()).to.be.equal(owner)

      // When
      // only owner can mint
      await expectRevert.unspecified(
        token.mint(
          kittyId,
          isReady,
          cooldownIndex,
          nextActionAt,
          siringWithId,
          birthTime,
          matronId,
          sireId,
          generation,
          genes,
          user,
          { from: user }
        )
      )

      const { logs } = await token.mint(
        kittyId,
        isReady,
        cooldownIndex,
        nextActionAt,
        siringWithId,
        birthTime,
        matronId,
        sireId,
        generation,
        genes,
        user,
        { from: owner }
      )

      // Then
      await expectEvent.inLogs(logs, 'Birth', {
        owner: user,
        kittyId: new BN(kittyId),
        matronId: new BN(matronId),
        sireId: new BN(sireId),
        genes: new BN(genes)
      })
      expect(await token.totalSupply()).to.be.bignumber.equal('1')
      expect(await token.ownerOf(kittyId)).to.be.equal(user)
      const tokenList = await token.tokensOfOwner(user)
      expect(tokenList.length).to.be.equal(1)
      expect(tokenList[0]).to.be.bignumber.equal(new BN(kittyId))
    })
  })
  describe('getKitty', () => {
    it('should return metadata of kitty', async () => {
      // Given
      await token.mint(
        kittyId,
        isReady,
        cooldownIndex,
        nextActionAt,
        siringWithId,
        birthTime,
        matronId,
        sireId,
        generation,
        genes,
        user,
        { from: owner }
      )

      // When
      const metadata = await token.getKitty(kittyId)

      // Then
      expect(metadata.isGestating).to.be.equal(true)
      expect(metadata.isReady).to.be.equal(true)
      expect(metadata.cooldownIndex).to.be.bignumber.equal(new BN(cooldownIndex))
      expect(metadata.nextActionAt).to.be.bignumber.equal(new BN(nextActionAt))
      expect(metadata.siringWithId).to.be.bignumber.equal(new BN(siringWithId))
      expect(metadata.birthTime).to.be.bignumber.equal(new BN(birthTime))
      expect(metadata.matronId).to.be.bignumber.equal(new BN(matronId))
      expect(metadata.sireId).to.be.bignumber.equal(new BN(sireId))
      expect(metadata.generation).to.be.bignumber.equal(new BN(generation))
      expect(metadata.genes).to.be.bignumber.equal(new BN(genes))
    })
  })
  describe('burn', () => {
    it('should burn the kitty', async () => {
      // Given
      await token.mint(
        kittyId,
        isReady,
        cooldownIndex,
        nextActionAt,
        siringWithId,
        birthTime,
        matronId,
        sireId,
        generation,
        genes,
        user,
        { from: owner }
      )

      // Then
      expect(await token.totalSupply()).to.be.bignumber.equal('1')
      expect(await token.ownerOf(kittyId)).to.be.equal(user)
      const initialUserTokenList = await token.tokensOfOwner(user)
      expect(initialUserTokenList.length).to.be.equal(1)
      expect(initialUserTokenList[0]).to.be.bignumber.equal(new BN(kittyId))

      // When

      // only owner of contract can burn
      await expectRevert.unspecified(token.burn(kittyId, { from: user }))
      // only owner of kitty can burn
      await expectRevert.unspecified(token.burn(kittyId, { from: owner }))

      await token.transfer(owner, kittyId, { from: user })
      expect(await token.ownerOf(kittyId)).to.be.equal(owner)
      const userTokenList = await token.tokensOfOwner(user)
      expect(userTokenList.length).to.be.equal(0)
      const ownerTokenList = await token.tokensOfOwner(owner)
      expect(ownerTokenList.length).to.be.equal(1)
      expect(ownerTokenList[0]).to.be.bignumber.equal(new BN(kittyId))

      const { logs } = await token.burn(kittyId, { from: owner })

      // Then
      await expectEvent.inLogs(logs, 'Death', {
        kittyId: new BN(kittyId)
      })
      expect(await token.totalSupply()).to.be.bignumber.equal('0')
      await expectRevert.unspecified(token.ownerOf(kittyId))
      const tokenList = await token.tokensOfOwner(owner)
      expect(tokenList.length).to.be.equal(0)

      const metadata = await token.getKitty(kittyId)

      expect(metadata.isGestating).to.be.equal(false)
      expect(metadata.isReady).to.be.equal(false)
      expect(metadata.cooldownIndex).to.be.bignumber.equal(new BN(0))
      expect(metadata.nextActionAt).to.be.bignumber.equal(new BN(0))
      expect(metadata.siringWithId).to.be.bignumber.equal(new BN(0))
      expect(metadata.birthTime).to.be.bignumber.equal(new BN(0))
      expect(metadata.matronId).to.be.bignumber.equal(new BN(0))
      expect(metadata.sireId).to.be.bignumber.equal(new BN(0))
      expect(metadata.generation).to.be.bignumber.equal(new BN(0))
      expect(metadata.genes).to.be.bignumber.equal(new BN(0))
    })
  })
  describe('ERC721', () => {
    beforeEach(async () => {
      token = await SimpleBridgeKitty.new()

      await token.mint(
        kittyId,
        isReady,
        cooldownIndex,
        nextActionAt,
        siringWithId,
        birthTime,
        matronId,
        sireId,
        generation,
        genes,
        user,
        { from: owner }
      )
    })
    describe('metadata', () => {
      it('should return name', async () => {
        expect(await token.name()).to.be.equal('CryptoKitties')
      })
      it('should return symbol', async () => {
        expect(await token.symbol()).to.be.equal('CK')
      })
    })
    describe('totalSupply', () => {
      it('should return total supply', async () => {
        expect(await token.totalSupply()).to.be.bignumber.equal('1')

        await token.mint(
          2,
          isReady,
          cooldownIndex,
          nextActionAt,
          siringWithId,
          birthTime,
          matronId,
          sireId,
          generation,
          genes,
          owner,
          { from: owner }
        )

        await token.mint(
          3,
          isReady,
          cooldownIndex,
          nextActionAt,
          siringWithId,
          birthTime,
          matronId,
          sireId,
          generation,
          genes,
          user,
          { from: owner }
        )
        expect(await token.totalSupply()).to.be.bignumber.equal('3')

        await token.burn(2, { from: owner })
        expect(await token.totalSupply()).to.be.bignumber.equal('2')
      })
    })
    describe('balanceOf', () => {
      it('should return amount of tokens of a user', async () => {
        expect(await token.balanceOf(owner)).to.be.bignumber.equal('0')

        await token.mint(
          2,
          isReady,
          cooldownIndex,
          nextActionAt,
          siringWithId,
          birthTime,
          matronId,
          sireId,
          generation,
          genes,
          owner,
          { from: owner }
        )

        await token.mint(
          3,
          isReady,
          cooldownIndex,
          nextActionAt,
          siringWithId,
          birthTime,
          matronId,
          sireId,
          generation,
          genes,
          owner,
          { from: owner }
        )
        expect(await token.balanceOf(owner)).to.be.bignumber.equal('2')

        await token.burn(2, { from: owner })
        expect(await token.balanceOf(owner)).to.be.bignumber.equal('1')
      })
    })
    describe('ownerOf', () => {
      it('should return owner of token', async () => {
        expect(await token.ownerOf(kittyId)).to.be.equal(user)

        await token.transfer(owner, kittyId, { from: user })

        expect(await token.ownerOf(kittyId)).to.be.equal(owner)
      })
    })
    describe('approve', () => {
      it('should emit an approval event', async () => {
        // Given
        const user2 = accounts[2]
        expect(await token.ownerOf(kittyId)).to.be.equal(user)

        // When

        // should own the token
        await expectRevert.unspecified(token.approve(user2, kittyId, { from: owner }))

        const { logs } = await token.approve(user2, kittyId, { from: user })

        // Then
        await expectEvent.inLogs(logs, 'Approval', {
          owner: user,
          approved: user2,
          tokenId: new BN(kittyId)
        })
      })
    })
    describe('transfer', () => {
      it('should transfer ownership of the token', async () => {
        // Given
        expect(await token.ownerOf(kittyId)).to.be.equal(user)
        expect(await token.balanceOf(user)).to.be.bignumber.equal('1')
        const initialUserTokenList = await token.tokensOfOwner(user)
        expect(initialUserTokenList.length).to.be.equal(1)
        expect(initialUserTokenList[0]).to.be.bignumber.equal(new BN(kittyId))

        // When
        // should own the token
        await expectRevert.unspecified(token.transfer(owner, kittyId, { from: owner }))
        // can't transfer to zero address
        await expectRevert.unspecified(token.transfer(constants.ZERO_ADDRESS, kittyId, { from: user }))
        // can't transfer to token address
        await expectRevert.unspecified(token.transfer(token.address, kittyId, { from: user }))
        const { logs } = await token.transfer(owner, kittyId, { from: user })

        // Then
        expect(await token.ownerOf(kittyId)).to.be.equal(owner)
        expect(await token.balanceOf(user)).to.be.bignumber.equal('0')
        expect(await token.balanceOf(owner)).to.be.bignumber.equal('1')
        const userTokenList = await token.tokensOfOwner(user)
        expect(userTokenList.length).to.be.equal(0)
        const ownerTokenList = await token.tokensOfOwner(owner)
        expect(ownerTokenList.length).to.be.equal(1)
        expect(ownerTokenList[0]).to.be.bignumber.equal(new BN(kittyId))

        await expectEvent.inLogs(logs, 'Transfer', {
          from: user,
          to: owner,
          tokenId: new BN(kittyId)
        })
      })
    })
    describe('transferFrom', () => {
      it('should transfer ownership of a previously approved token', async () => {
        // Given
        expect(await token.ownerOf(kittyId)).to.be.equal(user)
        expect(await token.balanceOf(user)).to.be.bignumber.equal('1')
        const initialUserTokenList = await token.tokensOfOwner(user)
        expect(initialUserTokenList.length).to.be.equal(1)
        expect(initialUserTokenList[0]).to.be.bignumber.equal(new BN(kittyId))

        // When
        // should first approve the transfer
        await expectRevert.unspecified(token.transferFrom(user, owner, kittyId, { from: owner }))

        await token.approve(owner, kittyId, { from: user })

        // can't transfer to zero address
        await expectRevert.unspecified(token.transferFrom(user, constants.ZERO_ADDRESS, kittyId, { from: owner }))
        // can't transfer to token address
        await expectRevert.unspecified(token.transferFrom(user, token.address, kittyId, { from: owner }))
        const { logs } = await token.transferFrom(user, owner, kittyId, { from: owner })

        // Then
        expect(await token.ownerOf(kittyId)).to.be.equal(owner)
        expect(await token.balanceOf(user)).to.be.bignumber.equal('0')
        expect(await token.balanceOf(owner)).to.be.bignumber.equal('1')
        const userTokenList = await token.tokensOfOwner(user)
        expect(userTokenList.length).to.be.equal(0)
        const ownerTokenList = await token.tokensOfOwner(owner)
        expect(ownerTokenList.length).to.be.equal(1)
        expect(ownerTokenList[0]).to.be.bignumber.equal(new BN(kittyId))

        await expectEvent.inLogs(logs, 'Transfer', {
          from: user,
          to: owner,
          tokenId: new BN(kittyId)
        })
      })
    })
  })
})
