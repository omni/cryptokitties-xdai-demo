const deployHome = require('./home')
const deployForeign = require('./foreign')

async function main() {
  const { simpleKittyCore } = await deployHome()
  const { kittyCore } = await deployForeign()
  console.log('\nDeployment has been completed.\n')
  console.log(`[ Home ] simpleKittyCore: ${simpleKittyCore}`)
  console.log(`[ Foreign ] kittyCore: ${kittyCore}`)
}

main().catch(e => console.log(e))
