const HomeMediator = artifacts.require('HomeMediator.sol')
const ForeignMediator = artifacts.require('ForeignMediator.sol')
const SimpleBridgeKitty = artifacts.require('SimpleBridgeKitty.sol')
const AMBMock = artifacts.require('AMBMock.sol')

const { ether, expectRevert, expectEvent, BN } = require('openzeppelin-test-helpers')
const { shouldBehaveLikeBasicMediator } = require('./basicMediator.test')

const maxGasPerTx = ether('1')
const tokenId = 1
const isReady = true
const cooldownIndex = 0
const nextActionAt = 2
const siringWithId = 3
const birthTime = 1511417999
const matronId = 4
const sireId = 5
const generation = 6
const genes = '623494533466173608148163391622294272936404886827521876326676079749575115'

contract('HomeMediator', accounts => {
  const owner = accounts[0]
  const user = accounts[1]
  beforeEach(async function() {
    this.bridge = await HomeMediator.new()
    this.mediatorContractOnOtherSide = ForeignMediator
  })
  shouldBehaveLikeBasicMediator(accounts)
  describe('transferToken', () => {
    it('should transfer tokens to mediator and emit event on amb bridge ', async () => {
      // Given
      const contract = await HomeMediator.new()
      const bridgeContract = await AMBMock.new()
      await bridgeContract.setMaxGasPerTx(maxGasPerTx)
      const token = await SimpleBridgeKitty.new()
      const mediatorContractOnOtherSide = await ForeignMediator.new()

      await contract.initialize(
        bridgeContract.address,
        mediatorContractOnOtherSide.address,
        token.address,
        maxGasPerTx,
        owner
      )

      await token.mint(
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
        user,
        { from: owner }
      )

      await token.transferOwnership(contract.address, { from: owner })

      // When
      // should approve the transfer first
      await expectRevert.unspecified(contract.transferToken(tokenId, { from: user }))

      await token.approve(contract.address, tokenId, { from: user })

      const { tx } = await contract.transferToken(tokenId, { from: user })

      // Then
      await expectEvent.inTransaction(tx, SimpleBridgeKitty, 'Transfer', {
        from: user,
        to: contract.address,
        tokenId: new BN(tokenId)
      })
      await expectEvent.inTransaction(tx, SimpleBridgeKitty, 'Death', {
        kittyId: new BN(tokenId)
      })
      await expectEvent.inTransaction(tx, AMBMock, 'MockedEvent')
    })
  })
})
