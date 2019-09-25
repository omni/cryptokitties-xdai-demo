const deployHome = require('./home')
const deployForeign = require('./foreign')
const initialize = require('./initialize')

async function main() {
  const { homeMediator, simpleKitty } = await deployHome()
  const { foreignMediator, kittyCore } = await deployForeign()
  await initialize({ homeMediator, foreignMediator, homeKitty: simpleKitty, foreignKitty: kittyCore })
  console.log('\nDeployment has been completed.\n')
  console.log(`[ Home ] homeMediator: ${homeMediator}`)
  console.log(`[ Home ] simpleKittyCore: ${simpleKitty}`)
  console.log(`[ Foreign ] foreignMediator: ${foreignMediator}`)
  console.log(`[ Foreign ] kittyCore: ${kittyCore}`)
}

main().catch(e => console.log(e))
