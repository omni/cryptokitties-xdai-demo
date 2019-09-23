const SimpleBridgeKitty = artifacts.require('SimpleBridgeKitty.sol')
const AMBMock = artifacts.require('AMBMock.sol')

const { expect } = require('chai')
const { ether, constants, expectRevert } = require('openzeppelin-test-helpers')

const maxGasPerTx = ether('1')

function shouldBehaveLikeBasicMediator(accounts) {
  describe('shouldBehaveLikeBasicMediator', () => {
    let bridgeContract
    let erc721token
    const owner = accounts[0]
    describe('initialize', () => {
      beforeEach(async () => {
        bridgeContract = await AMBMock.new()
        await bridgeContract.setMaxGasPerTx(maxGasPerTx)
        erc721token = await SimpleBridgeKitty.new()
      })
      it('should initialize', async function() {
        const contract = this.bridge
        const mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()

        expect(await contract.isInitialized()).to.be.equal(false)
        expect(await contract.bridgeContract()).to.be.equal(constants.ZERO_ADDRESS)
        expect(await contract.mediatorContractOnOtherSide()).to.be.equal(constants.ZERO_ADDRESS)
        expect(await contract.erc721token()).to.be.equal(constants.ZERO_ADDRESS)
        expect(await contract.requestGasLimit()).to.be.bignumber.equal('0')
        expect(await contract.owner()).to.be.equal(constants.ZERO_ADDRESS)
        expect(await contract.deployedAtBlock()).to.be.bignumber.equal('0')

        // not valid bridge contract
        await expectRevert.unspecified(
          contract.initialize(
            constants.ZERO_ADDRESS,
            mediatorContractOnOtherSide.address,
            erc721token.address,
            maxGasPerTx,
            owner
          )
        )

        // not valid erc721 contract
        await expectRevert.unspecified(
          contract.initialize(
            bridgeContract.address,
            mediatorContractOnOtherSide.address,
            constants.ZERO_ADDRESS,
            maxGasPerTx,
            owner
          )
        )

        await contract.initialize(
          bridgeContract.address,
          mediatorContractOnOtherSide.address,
          erc721token.address,
          maxGasPerTx,
          owner
        )

        // already initialized
        await expectRevert.unspecified(
          contract.initialize(
            bridgeContract.address,
            mediatorContractOnOtherSide.address,
            erc721token.address,
            maxGasPerTx,
            owner
          )
        )

        expect(await contract.isInitialized()).to.be.equal(true)
        expect(await contract.bridgeContract()).to.be.equal(bridgeContract.address)
        expect(await contract.mediatorContractOnOtherSide()).to.be.equal(mediatorContractOnOtherSide.address)
        expect(await contract.erc721token()).to.be.equal(erc721token.address)
        expect(await contract.requestGasLimit()).to.be.bignumber.equal(maxGasPerTx)
        expect(await contract.owner()).to.be.equal(owner)
        expect(await contract.deployedAtBlock()).to.be.bignumber.above('0')
      })
      it('only owner can set bridge contract', async function() {
        const contract = this.bridge
        const mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()
        const user = accounts[1]
        const notAContractAddress = accounts[2]

        await contract.initialize(
          bridgeContract.address,
          mediatorContractOnOtherSide.address,
          erc721token.address,
          maxGasPerTx,
          owner
        )

        expect(await contract.bridgeContract()).to.be.equal(bridgeContract.address)

        const newBridgeContract = await AMBMock.new()

        await expectRevert.unspecified(contract.setBridgeContract(newBridgeContract.address, { from: user }))
        await expectRevert.unspecified(contract.setBridgeContract(notAContractAddress, { from: owner }))

        await contract.setBridgeContract(newBridgeContract.address, { from: owner })
        expect(await contract.bridgeContract()).to.be.equal(newBridgeContract.address)
      })
      it('only owner can set mediator contract', async function() {
        const contract = this.bridge
        const mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()
        const user = accounts[1]

        await contract.initialize(
          bridgeContract.address,
          mediatorContractOnOtherSide.address,
          erc721token.address,
          maxGasPerTx,
          owner
        )

        expect(await contract.bridgeContract()).to.be.equal(bridgeContract.address)

        const newMediatorContract = await this.mediatorContractOnOtherSide.new()

        await expectRevert.unspecified(
          contract.setMediatorContractOnOtherSide(newMediatorContract.address, { from: user })
        )

        await contract.setMediatorContractOnOtherSide(newMediatorContract.address, { from: owner })
        expect(await contract.mediatorContractOnOtherSide()).to.be.equal(newMediatorContract.address)
      })
      it('only owner can set request Gas Limit', async function() {
        const contract = this.bridge
        const mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()
        const user = accounts[1]

        await contract.initialize(
          bridgeContract.address,
          mediatorContractOnOtherSide.address,
          erc721token.address,
          maxGasPerTx,
          owner
        )

        expect(await contract.requestGasLimit()).to.be.bignumber.equal(maxGasPerTx)

        const newMaxGasPerTx = ether('0.5')
        const invalidMaxGasPerTx = ether('1.5')

        await expectRevert.unspecified(contract.setRequestGasLimit(newMaxGasPerTx, { from: user }))

        // invalidMaxGasPerTx > bridgeContract.maxGasPerTx
        await expectRevert.unspecified(contract.setRequestGasLimit(invalidMaxGasPerTx, { from: owner }))

        await contract.setRequestGasLimit(newMaxGasPerTx, { from: owner })
        expect(await contract.requestGasLimit()).to.be.bignumber.equal(newMaxGasPerTx)
      })
    })
    describe('getBridgeMode', () => {
      it('should return bridge mode and interface', async function() {
        const contract = this.bridge
        const bridgeModeHash = '0xb64f0fee' // 4 bytes of keccak256('nft-to-nft-amb')
        expect(await contract.getBridgeMode()).to.be.equal(bridgeModeHash)

        const { major, minor, patch } = await contract.getBridgeInterfacesVersion()
        expect(major).to.be.bignumber.gte('0')
        expect(minor).to.be.bignumber.gte('0')
        expect(patch).to.be.bignumber.gte('0')
      })
    })
  })
}

module.exports = {
  shouldBehaveLikeBasicMediator
}
