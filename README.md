# Embedded DPet
This is an embedded version of the [DPet](https://github.com/phillyfan1138/DPet) app.  It runs on a Raspberry Pi 3.  It uses the ARM geth binary for ethereum. 
## Instructions
Attach a sensor to the serial port on the Raspberry Pi 3.  Start geth using the command ```sudo ./geth.sh```.  This will print to eth.log; wait for the blockchain to sync (only importing 1 block at a time).  Run ```sudo node index.js```.  Wait for ```opened``` and ```open```.  This starts a web server on the Raspberry Pi.  Then in a browser (on a seperate machine on the same network) go to localip:3500.  