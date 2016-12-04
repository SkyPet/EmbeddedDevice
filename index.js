var express = require('express');
var app = express();
var path = require('path');
var fs=require('fs');
var CryptoJS = require("crypto-js");
var Web3 = require('web3');
var SerialPort=require("serialport");
var uuid = require('node-uuid');
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 4000 });
const web3=new Web3();
const port=3500;
const spawn = require( 'child_process' ).spawn;
const exec = require( 'child_process' ).exec;
const contractAddress='0x72c1bba9cabab4040c285159c8ea98fd36372858';
const passwordFileName='pswd.txt';
const testing=true;

/*Global variables.  This is ok because only one pet can be scanned at a time*/
var contract="";
var hashId="";
var unHashedId="";
var searchResults=[]; 

app.use(express.static(path.join(__dirname, 'DPetEmbed/build'))); 

app.listen(port);
wss.on('connection', (ws)=>{
    ws.on('message', (message)=>{
        //var data=JSON.parse(message);
        //var keys=Object.keys(data);
        addAttribute(message);
    });
    ws.send(JSON.stringify({accounts:web3.eth.defaultAccount}));
    ws.send(JSON.stringify({contractAddress:contractAddress}));
    ws.send(JSON.stringify({cost:web3.fromWei(contract.costToAdd()).toString()}));
    ws.send(JSON.stringify({moneyInAccount:web3.fromWei(web3.eth.getBalance(web3.eth.defaultAccount))}));
    if(hashId){
        ws.send(JSON.stringify({petId:hashId}));
        ws.send(JSON.stringify({retrievedData:searchResults}));
    }
    ws.on('close', (msg)=>{
        if(testing){
            hashId="";
            unHashedId="";
        }
    });
    
});
wss.broadcast = function(data) {
    wss.clients.forEach((client)=>{
        client.send(data);
    });
};
if(!testing){
    var sPort=new SerialPort("/dev/ttyAMA0", {
        parser: SerialPort.parsers.byteLength(14)
    });
    sPort.on('open', ()=>{
        console.log("opened");
    });
    sPort.on('data', (data)=>{
        data=data.toString();
        data=data.substring(2, data.length);
        data=data.substring(0, data.length-1);
        console.log(data); //HUGE SECURITY RISK!
        if(data){
            unHashedId=data;
            hashId=web3.sha3(data);
            wss.broadcast(JSON.stringify({petId:hashId}));
            if(contract){
                getAttributes();
            }
        } 
    });
}

var pswd=path.join(__dirname, passwordFileName);
var datadir='--datadir "~/.ethereum/geth/lightchaindata"';
var ipcpath='$HOME/.ethereum/geth.ipc';
if(testing){
    datadir='--datadir "~/.ethereum/testnet/geth/lightchaindata"';
    ipcpath='$HOME/.ethereum/testnet/geth.ipc';
    unHashedId="MyId4";
    checkPswd(()=>{
        hashId=web3.sha3(unHashedId);
        wss.broadcast(JSON.stringify({petId:hashId}));
        getAttributes();
    });
}
else{
    checkPswd();
}

function checkPswd(cb){
    exec('./geth '+datadir+'  account list', (err, stdout, stderr)=>{
        console.log(stdout);
        if(err||!stdout){
            var value=uuid.v1().replace(/-/g, "");
            fs.writeFile(pswd, value, (err)=>{
                if(err) {
                    return console.log(err);
                }
                exec('./geth '+datadir+' --password '+passwordFileName+' account new', (err, stdout, stderr)=>{
                    if(err){
                        return console.log(err);
                    }
                    runGeth(value, cb);
                });
            });
        }
        else{
            fs.readFile(pswd, (err, data)=>{
                if(err){
                    return console.log(err);
                }
                runGeth(data, cb);
            });
        }
        
    });
}
function runGeth(password, cb){
    exec('./geth --exec "personal.unlockAccount(eth.accounts[0], \''+password+'\', 0)" attach ipc:'+ipcpath, (err, stdout, stderr)=>{
        stdout=stdout.trim();
        if(err||(stdout!=="true")){
            return console.log(err||stdout);
        }
        else{
            console.log("open");
            runWeb3(cb);
        }
    });
}
function runWeb3(cb){
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
    var abi =[{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getRevenue","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"index","type":"uint256"}],"name":"getAttribute","outputs":[{"name":"","type":"uint256"},{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"costToAdd","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_petid","type":"bytes32"}],"name":"getNumberOfAttributes","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"_attribute","type":"string"}],"name":"addAttribute","outputs":[],"payable":true,"type":"function"},{"inputs":[],"type":"constructor"},{"payable":false,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"_attribute","type":"string"}],"name":"attributeAdded","type":"event"}];
    
    if(web3.eth.accounts.length>0){
        web3.eth.defaultAccount=web3.eth.accounts[0];
    }
    contract=web3.eth.contract(abi).at(contractAddress);
    cb?cb():console.log("Contract Initiated");
    
}

function getAttributes(){
    var maxIndex=contract.getNumberOfAttributes(hashId).c[0];
    searchResults=[];
    for(var i=0; i<maxIndex;++i){
        var val=contract.getAttribute(hashId, i);
        var parsedResult=CryptoJS.AES.decrypt(val[1], unHashedId).toString(CryptoJS.enc.Utf8);
        var attrType="generic";
        var attrValue=val;
        var isEncrypted=false;
        try{
            parsedResult=JSON.parse(parsedResult);
            console.log(parsedResult);
            Object.keys(parsedResult).map((key)=>{
                if(key==='addedEncryption'){
                    isEncrypted=parsedResult[key];
                }
                else{
                    attrType=key;
                    attrValue=parsedResult[key];
                }
                
            });
        }catch(e){
            console.log(e);
        }
        
        
        searchResults.push({timestamp:new Date(val[0].c[0]*1000), attributeType:attrType, attributeText:attrValue, isEncrypted:isEncrypted});
    }
    results={retrievedData:searchResults};
    wss.broadcast(JSON.stringify(results));
}

function addAttribute(message){
    if(contract.costToAdd().greaterThan(web3.eth.getBalance(web3.eth.defaultAccount))){
        wss.broadcast(JSON.stringify({error:"Not enough Ether!"}));
        return;
    }
    //var obj={};
    //obj[attributeType]=
    //;
    contract.addAttribute.sendTransaction(hashId, CryptoJS.AES.encrypt(message, unHashedId).toString(),
    {value:contract.costToAdd(), gas:3000000}, (err, results)=>{
        if(err){
            console.log(err);
            //console.log(results);
        }
        else{
            console.log(results);
        }
    });
    /*contract.attributeError({_petid:hashId}, (error, result)=>{
        if(error){
            console.log(error);
            return;
        }
        console.log(result);
    });*/
    contract.attributeAdded({_petid:hashId}, (error, result)=>{
        if(error){
            console.log(error);
            return;
        }
        console.log(result);
        getAttributes(contract, hashId);
        wss.broadcast(JSON.stringify({moneyInAccount:web3.fromWei(web3.eth.getBalance(web3.eth.defaultAccount))}));
    });
}