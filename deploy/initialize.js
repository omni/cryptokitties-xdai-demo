const Web3Utils = require('web3-utils')
const assert = require('assert')

const EternalStorageProxy = require('../build/contracts/EternalStorageProxy')
const HomeMediator = require('../build/contracts/HomeMediator')
const ForeignMediator = require('../build/contracts/ForeignMediator')

const {
  privateKeyToAddress,
  sendRawTxHome,
  sendRawTxForeign,
  transferProxyOwnership,
  web3Home,
  web3Foreign,
  deploymentPrivateKey
} = require('./deploymentUtils')

const {
  HOME_RPC_URL,
  HOME_AMB_BRIDGE,
  HOME_MEDIATOR_REQUEST_GAS_LIMIT,
  HOME_MEDIATOR_OWNER,
  HOME_UPGRADEABLE_ADMIN,
  FOREIGN_RPC_URL,
  FOREIGN_MEDIATOR_OWNER,
  FOREIGN_UPGRADEABLE_ADMIN,
  FOREIGN_AMB_BRIDGE,
  FOREIGN_MEDIATOR_REQUEST_GAS_LIMIT,
  DEPLOYMENT_ACCOUNT_PRIVATE_KEY
} = process.env

const accountAddress = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)

async function initialize({
  web3,
  url,
  address,
  abi,
  proxyAbi,
  params: { bridgeContract, mediatorContract, token, requestGasLimit, owner },
  upgradeableAdmin,
  sendRawTx
}) {
  let nonce = await web3.eth.getTransactionCount(accountAddress)

  const contract = new web3.eth.Contract(abi, address)
  console.log(`
AMB contract: ${bridgeContract}, 
Mediator contract: ${mediatorContract}, 
Token contract: ${token},
MEDIATOR_REQUEST_GAS_LIMIT : ${requestGasLimit}, 
OWNER: ${owner}
`)

  const initializeData = await contract.methods
    .initialize(bridgeContract, mediatorContract, token, requestGasLimit, owner)
    .encodeABI()
  const txInitialize = await sendRawTx({
    data: initializeData,
    nonce,
    to: address,
    privateKey: deploymentPrivateKey,
    url
  })

  assert.strictEqual(Web3Utils.hexToNumber(txInitialize.status), 1, 'Transaction Failed')
  nonce++

  console.log('\nTransferring mediator proxy ownership to upgradeable admin')
  const proxy = new web3.eth.Contract(proxyAbi, address)
  await transferProxyOwnership({
    proxy,
    newOwner: upgradeableAdmin,
    nonce,
    url
  })
}

async function initializeMediators({ homeMediator, foreignMediator, homeKitty, foreignKitty }) {
  console.log('\n[Home] Initializing Home Mediator with following parameters:')
  await initialize({
    web3: web3Home,
    url: HOME_RPC_URL,
    address: homeMediator,
    abi: HomeMediator.abi,
    proxyAbi: EternalStorageProxy.abi,
    params: {
      bridgeContract: HOME_AMB_BRIDGE,
      mediatorContract: foreignMediator,
      token: homeKitty,
      requestGasLimit: HOME_MEDIATOR_REQUEST_GAS_LIMIT,
      owner: HOME_MEDIATOR_OWNER
    },
    upgradeableAdmin: HOME_UPGRADEABLE_ADMIN,
    sendRawTx: sendRawTxHome
  })

  console.log('\n[Foreign] Initializing Foreign Mediator with following parameters:')
  await initialize({
    web3: web3Foreign,
    url: FOREIGN_RPC_URL,
    address: foreignMediator,
    abi: ForeignMediator.abi,
    proxyAbi: EternalStorageProxy.abi,
    params: {
      bridgeContract: FOREIGN_AMB_BRIDGE,
      mediatorContract: homeMediator,
      token: foreignKitty,
      requestGasLimit: FOREIGN_MEDIATOR_REQUEST_GAS_LIMIT,
      owner: FOREIGN_MEDIATOR_OWNER
    },
    upgradeableAdmin: FOREIGN_UPGRADEABLE_ADMIN,
    sendRawTx: sendRawTxForeign
  })
}

module.exports = initializeMediators
