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

const { DEPLOYMENT_ACCOUNT_PRIVATE_KEY, KITTIES_AMOUNT, FOREIGN_RPC_URL } = process.env

async function main() {
  const accountAddress = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)
  let nonce = await web3Foreign.eth.getTransactionCount(accountAddress)

  // deploy contract
  console.log('Deploying kittyCore contract')
  const kittyCoreContract = await deployContract(kittyCore, [], {
    from: accountAddress,
    network: 'foreign',
    nonce
  })
  nonce++
  console.log('kittyCore Address: ', kittyCoreContract.options.address)

  // mint kitties
  const kittiesAmount = Number(KITTIES_AMOUNT)
  if (kittiesAmount) {
    console.log('Minting kitties to', accountAddress)
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
      console.log(`Minted Kitty ID: ${i}`)
      nonce++
    }
  }
}

main().catch(e => console.log(e))
