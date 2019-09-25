# cryptokitties-xdai-demo

#### Install dependencies
```bash
yarn
```

#### Compile contracts
```bash
yarn compile
```

#### Deploy contracts

Create `.env` file in project root with the following parameters:
```
#The private key hex value of the account responsible for contracts deployment
DEPLOYMENT_ACCOUNT_PRIVATE_KEY=67..14
# Extra gas added to the estimated gas of a particular deployment/configuration transaction
DEPLOYMENT_GAS_LIMIT_EXTRA=0.2
# The RPC channel to a Home node able to handle deployment/configuration transactions.
HOME_RPC_URL=https://sokol.poa.network
# The "gasPrice" parameter set in every deployment/configuration transaction on Home network (in Wei).
HOME_DEPLOYMENT_GAS_PRICE=1000000000
# The address of the existing AMB bridge in the Home network that will be used to pass messages
# to the Foreign network.
HOME_AMB_BRIDGE=0x0000000000000000000000000000000000000000
# The gas limit that will be used in the execution of the message passed to the mediator contract
# in the Foreign network.
HOME_MEDIATOR_REQUEST_GAS_LIMIT=1000000
# Address on Home network with permissions to change parameters of the mediator contract.
HOME_MEDIATOR_OWNER=0x0000000000000000000000000000000000000000
# Address on Home network with permissions to upgrade the mediator contract
HOME_UPGRADEABLE_ADMIN=0x0000000000000000000000000000000000000000

# The RPC channel to a Foreign node able to handle deployment/configuration transactions.
FOREIGN_RPC_URL=https://sokol.poa.network
# The "gasPrice" parameter set in every deployment/configuration transaction on Foreign network (in Wei).
FOREIGN_DEPLOYMENT_GAS_PRICE=1000000000
# The address of the existing AMB bridge in the Foreign network that will be used to pass messages
# to the Home network.
FOREIGN_AMB_BRIDGE=0x0000000000000000000000000000000000000000
# The gas limit that will be used in the execution of the message passed to the mediator contract
# in the Home network.
FOREIGN_MEDIATOR_REQUEST_GAS_LIMIT=1000000
# Address on Foreign network with permissions to change parameters of the mediator contract.
FOREIGN_MEDIATOR_OWNER=0x0000000000000000000000000000000000000000
# Address on Foreign network with permissions to upgrade the mediator contract
FOREIGN_UPGRADEABLE_ADMIN=0x0000000000000000000000000000000000000000

# Cryptokitties contract address on Foreign network. If not defined or set to address zero, the contract will be deployed on Foreign network.
CRYPTOKITTIES_ADDRESS=0x0000000000000000000000000000000000000000
# Amount of Kitties to Mint on Foreign network
KITTIES_AMOUNT=1
```

Then 
```
yarn deploy
```

#### Flat contracts
```bash
yarn flatten
```
