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
# The RPC channel to a Foreign node able to handle deployment/configuration transactions.
FOREIGN_RPC_URL=https://sokol.poa.network
# The "gasPrice" parameter set in every deployment/configuration transaction on Foreign network (in Wei).
FOREIGN_DEPLOYMENT_GAS_PRICE=1000000000
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
