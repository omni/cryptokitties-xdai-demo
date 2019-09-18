const simpleKittyCore = require('../build/contracts/SimpleKittyCore')
const { deployContract, privateKeyToAddress, web3Home } = require('./deploymentUtils')

const { DEPLOYMENT_ACCOUNT_PRIVATE_KEY } = process.env

async function deployHome() {
  const accountAddress = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)
  const nonce = await web3Home.eth.getTransactionCount(accountAddress)

  // deploy contract
  console.log('[Home] Deploying simpleKittyCore contract')
  const simpleKittyCoreContract = await deployContract(simpleKittyCore, [], {
    from: accountAddress,
    network: 'home',
    nonce
  })
  console.log('[Home] simpleKittyCore Address: ', simpleKittyCoreContract.options.address)

  return {
    simpleKittyCore: simpleKittyCoreContract.options.address
  }
}

module.exports = deployHome
