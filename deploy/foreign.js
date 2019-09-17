const assert = require('assert')
const Web3Utils = require('web3-utils')
const kittyCore = require('../build/contracts/KittyCore')
const {
  deployContract,
  privateKeyToAddress,
  web3Foreign,
  deploymentPrivateKey,
  sendRawTxForeign
} = require('./deploymentUtils')

const { DEPLOYMENT_ACCOUNT_PRIVATE_KEY, CRYPTOKITTIES_ADDRESS, KITTIES_AMOUNT, FOREIGN_RPC_URL } = process.env

async function deployForeign() {
  const accountAddress = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)
  let nonce = await web3Foreign.eth.getTransactionCount(accountAddress)
  let kittyCoreAddress = CRYPTOKITTIES_ADDRESS

  if (!CRYPTOKITTIES_ADDRESS || CRYPTOKITTIES_ADDRESS === '0x0000000000000000000000000000000000000000') {
    // deploy contract
    console.log('[Foreign] Deploying kittyCore contract')
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
      console.log('[Foreign] Minting kitties to', accountAddress)
      for (let i = 1; i <= kittiesAmount; i++) {
        const mintData = await kittyCoreContract.methods.createPromoKitty(i, accountAddress).encodeABI()
        const txMint = await sendRawTxForeign({
          data: mintData,
          nonce,
          to: kittyCoreContract.options.address,
          privateKey: deploymentPrivateKey,
          url: FOREIGN_RPC_URL
        })
        assert.strictEqual(Web3Utils.hexToNumber(txMint.status), 1, 'Transaction Failed')
        console.log(`[Foreign] Minted Kitty ID: ${i}`)
        nonce++
      }
    }
  }

  return {
    kittyCore: kittyCoreAddress
  }
}

module.exports = deployForeign
