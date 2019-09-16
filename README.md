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
# The "gasPrice" parameter set in every deployment/configuration transaction on Foreign network (in Wei).
FOREIGN_DEPLOYMENT_GAS_PRICE=1000000000
# The RPC channel to a Foreign node able to handle deployment/configuration transactions.
FOREIGN_RPC_URL=https://sokol.poa.network
# Amount of Kitties to Mint
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
