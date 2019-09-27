#!/usr/bin/env bash

if [ -d flats ]; then
  rm -rf flats
fi

mkdir -p flats/kitty
mkdir -p flats/simpleKitty
mkdir -p flats/mediator
mkdir -p flats/upgradeability

FLATTENER=./node_modules/.bin/truffle-flattener

${FLATTENER} contracts/kitty/KittyCore.sol > flats/kitty/KittyCore_flat.sol
${FLATTENER} contracts/simpleKitty/SimpleBridgeKitty.sol > flats/simpleKitty/SimpleBridgeKitty_flat.sol
${FLATTENER} contracts/mediator/HomeMediator.sol > flats/mediator/HomeMediator_flat.sol
${FLATTENER} contracts/mediator/ForeignMediator.sol > flats/mediator/ForeignMediator_flat.sol
${FLATTENER} contracts/upgradeability/EternalStorageProxy.sol > flats/upgradeability/EternalStorageProxy_flat.sol
