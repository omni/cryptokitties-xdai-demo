#!/usr/bin/env bash

if [ -d flats ]; then
  rm -rf flats
fi

mkdir -p flats/kitty
mkdir -p flats/simpleKitty
mkdir -p flats/mediator

FLATTENER=./node_modules/.bin/truffle-flattener
KITTY_CONTRACTS_DIR=contracts/kitty


${FLATTENER} ${KITTY_CONTRACTS_DIR}/KittyCore.sol > flats/kitty/KittyCore_flat.sol
${FLATTENER} ${KITTY_CONTRACTS_DIR}/GeneScience.sol > flats/kitty/GeneScience_flat.sol
${FLATTENER} ${KITTY_CONTRACTS_DIR}/SaleClockAuction.sol > flats/kitty/SaleClockAuction_flat.sol
${FLATTENER} ${KITTY_CONTRACTS_DIR}/SiringClockAuction.sol > flats/kitty/SiringClockAuction_flat.sol
${FLATTENER} contracts/simpleKitty/SimpleBridgeKitty.sol > flats/simpleKitty/SimpleBridgeKitty_flat.sol
${FLATTENER} contracts/mediator/HomeMediator.sol > flats/mediator/HomeMediator_flat.sol
${FLATTENER} contracts/mediator/ForeignMediator.sol > flats/mediator/ForeignMediator_flat.sol
