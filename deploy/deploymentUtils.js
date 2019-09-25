/* eslint-disable no-param-reassign */
require('dotenv').config()
const BigNumber = require('bignumber.js')
const Web3 = require('web3')
const Tx = require('ethereumjs-tx')
const Web3Utils = require('web3-utils')
const fetch = require('node-fetch')
const assert = require('assert')

const { HOME_RPC_URL, FOREIGN_RPC_URL, DEPLOYMENT_ACCOUNT_PRIVATE_KEY } = process.env

const homeProvider = new Web3.providers.HttpProvider(HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const foreignProvider = new Web3.providers.HttpProvider(FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

const { HOME_DEPLOYMENT_GAS_PRICE, FOREIGN_DEPLOYMENT_GAS_PRICE, DEPLOYMENT_GAS_LIMIT_EXTRA } = process.env
const GAS_LIMIT_EXTRA = Number(DEPLOYMENT_GAS_LIMIT_EXTRA)

const deploymentPrivateKey = Buffer.from(DEPLOYMENT_ACCOUNT_PRIVATE_KEY, 'hex')
const receiptInterval = 3000

async function deployContract(contractJson, args, { from, network, nonce }) {
  let web3
  let url
  let gasPrice
  if (network === 'foreign') {
    web3 = web3Foreign
    url = FOREIGN_RPC_URL
    gasPrice = FOREIGN_DEPLOYMENT_GAS_PRICE
  } else {
    web3 = web3Home
    url = HOME_RPC_URL
    gasPrice = HOME_DEPLOYMENT_GAS_PRICE
  }
  const options = {
    from
  }
  const instance = new web3.eth.Contract(contractJson.abi, options)
  const result = await instance
    .deploy({
      data: contractJson.bytecode,
      arguments: args
    })
    .encodeABI()
  const tx = await sendRawTx({
    data: result,
    nonce: Web3Utils.toHex(nonce),
    to: null,
    privateKey: deploymentPrivateKey,
    url,
    gasPrice
  })
  if (Web3Utils.hexToNumber(tx.status) !== 1 && !tx.contractAddress) {
    throw new Error('Tx failed')
  }
  instance.options.address = tx.contractAddress
  instance.deployedBlockNumber = tx.blockNumber
  return instance
}

async function sendRawTxHome(options) {
  return sendRawTx({
    ...options,
    gasPrice: HOME_DEPLOYMENT_GAS_PRICE
  })
}

async function sendRawTxForeign(options) {
  return sendRawTx({
    ...options,
    gasPrice: FOREIGN_DEPLOYMENT_GAS_PRICE
  })
}

async function sendRawTx({ data, nonce, to, privateKey, url, gasPrice, value }) {
  try {
    const txToEstimateGas = {
      from: privateKeyToAddress(Web3Utils.bytesToHex(privateKey)),
      value,
      to,
      data
    }
    const estimatedGas = BigNumber(await sendNodeRequest(url, 'eth_estimateGas', txToEstimateGas))

    const blockData = await sendNodeRequest(url, 'eth_getBlockByNumber', ['latest', false])
    const blockGasLimit = BigNumber(blockData.gasLimit)
    if (estimatedGas.isGreaterThan(blockGasLimit)) {
      throw new Error(
        `estimated gas greater (${estimatedGas.toString()}) than the block gas limit (${blockGasLimit.toString()})`
      )
    }
    let gas = estimatedGas.multipliedBy(BigNumber(1 + GAS_LIMIT_EXTRA))
    if (gas.isGreaterThan(blockGasLimit)) {
      gas = blockGasLimit
    } else {
      gas = gas.toFixed(0)
    }

    const rawTx = {
      nonce,
      gasPrice: Web3Utils.toHex(gasPrice),
      gasLimit: Web3Utils.toHex(gas),
      to,
      data,
      value
    }

    const tx = new Tx(rawTx)
    tx.sign(privateKey)
    const serializedTx = tx.serialize()
    const txHash = await sendNodeRequest(url, 'eth_sendRawTransaction', `0x${serializedTx.toString('hex')}`)
    console.log('pending txHash', txHash)
    return await getReceipt(txHash, url)
  } catch (e) {
    console.error(e)
  }
}

async function sendNodeRequest(url, method, signedData) {
  if (!Array.isArray(signedData)) {
    signedData = [signedData]
  }
  const request = await fetch(url, {
    headers: {
      'Content-type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params: signedData,
      id: 1
    })
  })
  const json = await request.json()
  if (typeof json.error === 'undefined' || json.error === null) {
    if (method === 'eth_sendRawTransaction') {
      assert.strictEqual(json.result.length, 66, `Tx wasn't sent ${json}`)
    }
    return json.result
  }
  throw new Error(`web3 RPC failed: ${JSON.stringify(json.error)}`)
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getReceipt(txHash, url) {
  await timeout(receiptInterval)
  let receipt = await sendNodeRequest(url, 'eth_getTransactionReceipt', txHash)
  if (receipt === null || receipt.blockNumber === null) {
    receipt = await getReceipt(txHash, url)
  }
  return receipt
}

function add0xPrefix(s) {
  if (s.indexOf('0x') === 0) {
    return s
  }

  return `0x${s}`
}

function privateKeyToAddress(privateKey) {
  return new Web3().eth.accounts.privateKeyToAccount(add0xPrefix(privateKey)).address
}

async function upgradeProxy({ proxy, implementationAddress, version, nonce, url }) {
  const data = await proxy.methods.upgradeTo(version, implementationAddress).encodeABI()
  const sendTx = getSendTxMethod(url)
  const result = await sendTx({
    data,
    nonce,
    to: proxy.options.address,
    privateKey: deploymentPrivateKey,
    url
  })
  assert.strictEqual(Web3Utils.hexToNumber(result.status), 1, 'Transaction Failed')
}

async function transferProxyOwnership({ proxy, newOwner, nonce, url }) {
  const data = await proxy.methods.transferProxyOwnership(newOwner).encodeABI()
  const sendTx = getSendTxMethod(url)
  const result = await sendTx({
    data,
    nonce,
    to: proxy.options.address,
    privateKey: deploymentPrivateKey,
    url
  })
  assert.strictEqual(Web3Utils.hexToNumber(result.status), 1, 'Transaction Failed')
}

async function transferOwnership({ contract, newOwner, nonce, url }) {
  const data = await contract.methods.transferOwnership(newOwner).encodeABI()
  const sendTx = getSendTxMethod(url)
  const result = await sendTx({
    data,
    nonce,
    to: contract.options.address,
    privateKey: deploymentPrivateKey,
    url
  })
  assert.strictEqual(Web3Utils.hexToNumber(result.status), 1, 'Transaction Failed')
}

function getSendTxMethod(url) {
  return url === HOME_RPC_URL ? sendRawTxHome : sendRawTxForeign
}

const kittyGenes = [
  '461318606473215840474968038713412278792841200610013055040007908862876014',
  '512901570795906580689310042942192685302828800779079863559617410586062221',
  '456123814460010858370996918295523736710893964491134685860209207735135662',
  '623347887640772406912616247570945954300391612998914019334437441678817675',
  '623327769702602566148110117488157993388740168622469003102795169878388139',
  '516517468280385478902426949869045996034332056826094284352752576550613389',
  '461303492617760133525700505199185512215446852893161871027943135841299852',
  '516350753935039751872377244600559998302956049058903453328289625078609292',
  '516350706387040918774838507181320473800432871454139137641571763026803053',
  '623315925723314209099500395652252912896485976535230435375457673062846598'
]

function getKittyGene(i) {
  return kittyGenes[i % kittyGenes.length]
}

module.exports = {
  deployContract,
  sendRawTxHome,
  sendRawTxForeign,
  privateKeyToAddress,
  upgradeProxy,
  transferProxyOwnership,
  transferOwnership,
  web3Home,
  web3Foreign,
  deploymentPrivateKey,
  getKittyGene
}
