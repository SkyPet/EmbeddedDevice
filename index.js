var express = require('express');
var app = express();
var path = require('path');
var fs=require('fs');
var CryptoJS = require("crypto-js");
var Web3 = require('web3');
var SerialPort=require("serialport");

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 4000 });

wss.on('connection', (ws)=>{
  ws.on('message', (message)=>{
    console.log('received: %s', message);
  });

  ws.send('something');
});
wss.broadcast = function(data) {
    wss.clients.forEach((client)=>{
        client.send(data);
    });
};

var web3=new Web3();
app.use(express.static(path.join(__dirname, 'Build'))); 
const port=3500;
app.listen(port);
const spawn = require( 'child_process' ).spawn;
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
var passwordFileName='pswd.txt';
var pswd=path.join(__dirname, passwordFileName);
function hidden(query, callback) {
    var stdin = process.openStdin();
    process.stdin.on("data", function(char) {
        char = char + "";
        switch (char) {
            case "\n":
            case "\r":
            case "\u0004":
                stdin.pause();
                break;
            default:
                process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length+1).join("*"));
                break;
        }
    });
    rl.question(query, function(value) {
        rl.history = rl.history.slice(1);
        callback(value);
        rl.close();
    });
}
fs.stat(pswd, function(err, stats) { 
    if (err) { 
        hidden("Enter Password for account 0 in Geth: ", function(value) {
            fs.writeFile(pswd, value, function(err) {
                if(err) {
                    return console.log(err);
                }
                runGeth();
            });
        }); 
    } 
    else{
        runGeth();
    }
}); 
function runGeth(){
    var isOpen=false;
    const geth = spawn( 'geth', [ '--rpc', '--rpccorsdomain=*', '--testnet', '--unlock=0', '--password='+passwordFileName, '--rpcapi="db,eth,net,web3,personal"', ' --rpcport="8545"', '--rpcaddr="localhost"']); 
    geth.stdout.on('data', data=>{
    });
    geth.stderr.on( 'data', data => { //for some reason Geth prints to stderr....
        data=""+data;
        var indexOfImported=data.indexOf("imported");
        var indexOfUnlocked=data.indexOf("Unlocked account");
        var indexOfServer=data.indexOf("Starting Server");
        if(indexOfImported>0 && !isOpen) {
            //open('http://localhost:3500');
            console.log("open");
            runWeb3();
            isOpen=true;
        }
        else if (indexOfUnlocked>0){
            console.log("Address unlocked: "+data.substring(indexOfUnlocked+"Unlocked account".length+1));
        }
        else if(indexOfServer>0){
            console.log("Geth Server Starting");
        }
        else if(!isOpen){
            console.log("Please wait...");
        }
    });
}
function runWeb3(){
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
    var abi =[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"trackNumberRecords","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"_type","type":"uint256"},{"name":"_attribute","type":"string"},{"name":"_isEncrypted","type":"bool"}],"name":"addAttribute","outputs":[],"type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"type":"function"},{"constant":false,"inputs":[],"name":"getRevenue","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"uint256"}],"name":"pet","outputs":[{"name":"timestamp","type":"uint256"},{"name":"typeAttribute","type":"uint256"},{"name":"attributeText","type":"string"},{"name":"isEncrypted","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"costToAdd","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"_type","type":"uint256"}],"name":"attributeAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"error","type":"string"}],"name":"attributeError","type":"event"}];
    const contractAddress='0x69De4ADbb566c1c68e8dB1274229adA4A3D9f8A8';
    if(web3.eth.accounts.length>0){
        web3.eth.defaultAccount=web3.eth.accounts[0];
    }
    var contract=web3.eth.contract(abi).at(contractAddress);
    var sPort=new SerialPort("/dev/ttyS0", {
        parser: SerialPort.parsers.byteLength(9)
    });
    sPort.on('open', ()=>{
        console.log("opened");
    });
    sPort.on('data', (data)=>{
        data=data.toString('hex');
        data=data.replace(/ /g, "");
        if(data){
            var results=getAttributes(contract, data);
            wss.broadcast(results);
            //send to all clients via websockets here
        } 
    });
}
function getAttributes(contract, id){
    var hashId=web3.sha3(id);
    var maxIndex=contract.trackNumberRecords(hashId).c[0];
    var currentResults=[];
    for(var i=0; i<maxIndex;++i){
        var val=contract.pet(hashId, i);
        var attributeText=CryptoJS.AES.decrypt(val[2], id).toString(CryptoJS.enc.Utf8);
        currentResults.push({timestamp:new Date(val[0].c[0]*1000), attributeType:val[1].c[0], attributeText:attributeText, isEncrypted:val[3]});
    }
    return currentResults;
}