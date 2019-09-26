const SimpleBridgeKitty = require('../build/contracts/SimpleBridgeKitty')
const EternalStorageProxy = require('../build/contracts/EternalStorageProxy')
const HomeMediator = require('../build/contracts/HomeMediator')
const { deployContract, privateKeyToAddress, web3Home, upgradeProxy, transferBridgeRole } = require('./deploymentUtils')

const { HOME_RPC_URL, DEPLOYMENT_ACCOUNT_PRIVATE_KEY } = process.env

async function deployHome() {
  const accountAddress = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)
  let nonce = await web3Home.eth.getTransactionCount(accountAddress)

  console.log('\n[Home] Deploying HomeMediator storage')
  const homeMediatorStorage = await deployContract(EternalStorageProxy, [], {
    from: accountAddress,
    nonce
  })
  nonce++
  console.log('[Home] HomeMediator Storage: ', homeMediatorStorage.options.address)

  console.log('\n[Home] Deploying HomeMediator implementation')
  const homeBridgeImplementation = await deployContract(HomeMediator, [], {
    from: accountAddress,
    nonce
  })
  nonce++
  console.log('[Home] HomeMediator Implementation: ', homeBridgeImplementation.options.address)

  console.log('\n[Home] Hooking up HomeMediator storage to HomeMediator implementation')
  await upgradeProxy({
    proxy: homeMediatorStorage,
    implementationAddress: homeBridgeImplementation.options.address,
    version: '1',
    nonce,
    url: HOME_RPC_URL
  })
  nonce++

  // deploy token contract
  console.log('\n[Home] Deploying simpleKittyCore contract')
  const simpleKittyContract = await deployContract(SimpleBridgeKitty, [], {
    from: accountAddress,
    network: 'home',
    nonce
  })
  nonce++
  console.log('[Home] simpleKittyCore Address: ', simpleKittyContract.options.address)

  console.log('\n[Home] Transferring ownership of Bridgeable token to HomeMediator contract')
  await transferBridgeRole({
    contract: simpleKittyContract,
    newOwner: homeMediatorStorage.options.address,
    nonce,
    url: HOME_RPC_URL
  })

  return {
    homeMediator: homeMediatorStorage.options.address,
    simpleKitty: simpleKittyContract.options.address
  }
}

module.exports = deployHome
