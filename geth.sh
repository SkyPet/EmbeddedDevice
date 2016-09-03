#!/usr/bin/env bash
echo "Starting Geth"
geth --rpc --testnet --datadir=/home/eth/.ethereum --ipcpath=/home/eth/.ethereum/testnet/geth.ipc --verbosity=3 2>> eth.log &

disown
