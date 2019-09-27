const assert = require('assert')
const Web3Utils = require('web3-utils')
const kittyCore = require('../build/contracts/KittyCore')
const EternalStorageProxy = require('../build/contracts/EternalStorageProxy')
const ForeignMediator = require('../build/contracts/ForeignMediator')
const {
  deployContract,
  privateKeyToAddress,
  web3Foreign,
  deploymentPrivateKey,
  sendRawTxForeign,
  upgradeProxy,
  getKittyGene
} = require('./deploymentUtils')

const { DEPLOYMENT_ACCOUNT_PRIVATE_KEY, CRYPTOKITTIES_ADDRESS, KITTIES_AMOUNT, FOREIGN_RPC_URL } = process.env

async function deployForeign() {
  const accountAddress = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)
  let nonce = await web3Foreign.eth.getTransactionCount(accountAddress)
  let kittyCoreAddress = CRYPTOKITTIES_ADDRESS

  if (!CRYPTOKITTIES_ADDRESS || CRYPTOKITTIES_ADDRESS === '0x0000000000000000000000000000000000000000') {
    // deploy contract
    console.log('\n[Foreign] Deploying kittyCore contract')
    const kittyCoreContract = await deployContract(kittyCore, [], {
      from: accountAddress,
      network: 'foreign',
      nonce
    })
    nonce++
    kittyCoreAddress = kittyCoreContract.options.address
    console.log('[Foreign] kittyCore Address: ', kittyCoreContract.options.address)

    // mint kitties
    const kittiesAmount = Number(KITTIES_AMOUNT)
    if (kittiesAmount) {
      console.log('\n[Foreign] Minting kitties to', accountAddress)
      for (let i = 0; i < kittiesAmount; i++) {
        const gene = getKittyGene(i)
        const mintData = await kittyCoreContract.methods.createPromoKitty(gene, accountAddress).encodeABI()
        const txMint = await sendRawTxForeign({
          data: mintData,
          nonce,
          to: kittyCoreContract.options.address,
          privateKey: deploymentPrivateKey,
          url: FOREIGN_RPC_URL
        })
        assert.strictEqual(Web3Utils.hexToNumber(txMint.status), 1, 'Transaction Failed')
        console.log(`[Foreign] Minted Kitty ID: ${i + 1}`)
        nonce++
      }
    }
  }

  console.log('\n[Foreign] Deploying ForeignMediator storage')
  const foreignMediatorStorage = await deployContract(EternalStorageProxy, [], {
    from: accountAddress,
    network: 'foreign',
    nonce
  })
  nonce++
  console.log('[Foreign] ForeignMediator Storage: ', foreignMediatorStorage.options.address)

  console.log('\n[Foreign] Deploying ForeignMediator implementation')
  const foreignBridgeImplementation = await deployContract(ForeignMediator, [], {
    from: accountAddress,
    network: 'foreign',
    nonce
  })
  nonce++
  console.log('[Foreign] ForeignMediator Implementation: ', foreignBridgeImplementation.options.address)

  console.log('\n[Foreign] Hooking up ForeignMediator storage to ForeignMediator implementation')
  await upgradeProxy({
    proxy: foreignMediatorStorage,
    implementationAddress: foreignBridgeImplementation.options.address,
    version: '1',
    nonce,
    url: FOREIGN_RPC_URL
  })

  return {
    foreignMediator: foreignMediatorStorage.options.address,
    kittyCore: kittyCoreAddress
  }
}

module.exports = deployForeign
