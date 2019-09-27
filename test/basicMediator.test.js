const SimpleBridgeKitty = artifacts.require('SimpleBridgeKitty.sol')
const AMBMock = artifacts.require('AMBMock.sol')

const { expect } = require('chai')
const { ether, constants, expectRevert } = require('openzeppelin-test-helpers')

const {
  maxGasPerTx,
  tokenId,
  isReady,
  cooldownIndex,
  nextActionAt,
  siringWithId,
  birthTime,
  matronId,
  sireId,
  generation,
  genes,
  metadata,
  exampleTxHash,
  nonce
} = require('./helpers')

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
    describe('requestFailedMessageFix', () => {
      let contract
      let mediatorContractOnOtherSide
      let data
      const user = accounts[1]
      beforeEach(async function() {
        bridgeContract = await AMBMock.new()
        await bridgeContract.setMaxGasPerTx(maxGasPerTx)
        erc721token = await SimpleBridgeKitty.new()

        contract = this.bridge
        mediatorContractOnOtherSide = await this.mediatorContractOnOtherSide.new()

        await contract.initialize(
          bridgeContract.address,
          mediatorContractOnOtherSide.address,
          erc721token.address,
          maxGasPerTx,
          owner
        )
        try {
          data = await contract.contract.methods.handleBridgedTokens(user, tokenId, nonce).encodeABI()
          await erc721token.mint(
            tokenId,
            isReady,
            cooldownIndex,
            nextActionAt,
            siringWithId,
            birthTime,
            matronId,
            sireId,
            generation,
            genes,
            contract.address,
            { from: owner }
          )
        } catch (e) {
          data = await contract.contract.methods.handleBridgedTokens(user, tokenId, metadata, nonce).encodeABI()
          await erc721token.transferBridgeRole(contract.address, { from: owner })
        }
      })
      it('should  allow to request a failed message fix', async () => {
        // Given
        await bridgeContract.executeMessageCall(
          contract.address,
          mediatorContractOnOtherSide.address,
          data,
          exampleTxHash,
          100
        )
        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(false)

        const dataHash = await bridgeContract.failedMessageDataHash(exampleTxHash)

        // When
        const { tx } = await contract.requestFailedMessageFix(exampleTxHash)

        // Then
        const receipt = await web3.eth.getTransactionReceipt(tx)
        const logs = AMBMock.decodeLogs(receipt.logs)
        expect(logs.length).to.be.equal(1)
        expect(logs[0].args.encodedData.includes(dataHash.replace(/^0x/, ''))).to.be.equal(true)
      })
      it('should be a failed transaction', async () => {
        // Given
        await bridgeContract.executeMessageCall(
          contract.address,
          mediatorContractOnOtherSide.address,
          data,
          exampleTxHash,
          1000000
        )
        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(true)

        // When
        await expectRevert.unspecified(contract.requestFailedMessageFix(exampleTxHash))
      })
      it('should be the receiver of the failed transaction', async () => {
        // Given
        await bridgeContract.executeMessageCall(
          bridgeContract.address,
          mediatorContractOnOtherSide.address,
          data,
          exampleTxHash,
          1000000
        )
        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(false)

        // When
        await expectRevert.unspecified(contract.requestFailedMessageFix(exampleTxHash))
      })
      it('message sender should be mediator from other side', async () => {
        // Given
        await bridgeContract.executeMessageCall(contract.address, contract.address, data, exampleTxHash, 1000000)
        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(false)

        // When
        await expectRevert.unspecified(contract.requestFailedMessageFix(exampleTxHash))
      })
      it('should allow to request a fix multiple times', async () => {
        // Given
        await bridgeContract.executeMessageCall(
          contract.address,
          mediatorContractOnOtherSide.address,
          data,
          exampleTxHash,
          100
        )
        expect(await bridgeContract.messageCallStatus(exampleTxHash)).to.be.equal(false)

        const dataHash = await bridgeContract.failedMessageDataHash(exampleTxHash)

        const { tx } = await contract.requestFailedMessageFix(exampleTxHash)

        const receipt = await web3.eth.getTransactionReceipt(tx)
        const logs = AMBMock.decodeLogs(receipt.logs)
        expect(logs.length).to.be.equal(1)
        expect(logs[0].args.encodedData.includes(dataHash.replace(/^0x/, ''))).to.be.equal(true)

        // When
        const { tx: secondTx } = await contract.requestFailedMessageFix(exampleTxHash)

        // Then
        const secondReceipt = await web3.eth.getTransactionReceipt(secondTx)
        const secondLogs = AMBMock.decodeLogs(secondReceipt.logs)
        expect(secondLogs.length).to.be.equal(1)
        expect(secondLogs[0].args.encodedData.includes(dataHash.replace(/^0x/, ''))).to.be.equal(true)
      })
    })
  })
}

module.exports = {
  shouldBehaveLikeBasicMediator
}
