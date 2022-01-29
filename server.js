const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://mwvzrddu:0JBtMaIMrFm2@m15.cloudmqtt.com:10738')
const axios = require('axios');
const datetime = require('date-time');
const express = require('express');
const winston = require('winston');
const url = require('url');
const app = express();
const sha1 = require('sha1');
const name = 'server';
const shell = require('shelljs');
const channelID = 635769;
const writekey = 'S5FBAC29LO2Y51FE';
let status = 'false';
const Web3 = require('web3');
let Address = null;
let AddressContract = null



const { format } = winston;
const { combine, label, json } = format;

//
// Configure the logger for `category1`
//
winston.loggers.add('category1', {
  format: combine(
    label({ label: 'category one' }),
    format.splat(),
    format.simple()
  ),
  transports: [
    new winston.transports.File({ filename: 'main/temperature.txt' })
  ]
});

//
// Configure the logger for `category2`
//
winston.loggers.add('category2', {
  format: combine(
    label({ label: 'category two' }),
    format.splat(),
    format.simple()
  ),
  transports: [
    new winston.transports.File({ filename: 'main/ir.txt' })
  ]
});

winston.loggers.add('category3', {
    format: combine(
      label({ label: 'category three' }),
      format.splat(),
      format.simple()
    ),
    transports: [
      new winston.transports.File({ filename: 'main/server.txt' })
    ]
  });


const category1 = winston.loggers.get('category1');
const category2 = winston.loggers.get('category2');
const category3 = winston.loggers.get('category3');


app.use(express.json())

// setup blockchain contract
const Address_AddressContract = setUp(Address,AddressContract);
Address = Address_AddressContract[0];
AddressContract = Address_AddressContract[1];

function sendToCloud(data,name){
    axios.post('https://api.thingspeak.com/channels/'+ channelID +'/bulk_update.json',{
        'write_api_key' : writekey,
        'updates' : data
    }      
    ).then((res)=>{
        console.log('data sent to cloud from ',name);
        category1.info('data sent to cloud from ' + name);
        data.forEach(element => {
            category1.info("temperature : ",element.field1);
        });
    })
    .catch((err)=>{
        console.log('error while sending data to cloud',err.message);
        category1.error('error while sending data to cloud',err.message);
    });
}


client.on('connect', function () {
    client.subscribe(['app/cloud/temperature/status','app/cloud/temperature/data','app/cloud/ir/data']);
    console.log('connected to mqtt server ',name);
    category3.info('connected to mqtt server ',name)
    }
);

client.on('message', async function (topic, message) {
    // message is Buffer
    console.log(topic)
    if(topic === 'app/cloud/temperature/data'){

        message = message.toString();
        const address = message.split('&');

        let flag = await checkValid(address);
        const name = address[1];

        if (flag){
            console.log("device authenticated");
            category1.info(name+'device athenticated');
            
            let temperature = address[2].split('/');

            let data = []
            for (let i = 0 ; i < temperature.length-1; i++){
                let delta_temp = temperature[i].split('#');

                data.push(
                    {
                        'delta_t': delta_temp[0],
                        'field1' : delta_temp[1]
                    }
                )
            }
            console.log("data",data);
            for(let i = 0 ; i < data.length;i++ ){
                if(parseInt(data[i].field1) > 40){
                    console.log("temp too high");
                    winston.info(name +" stopped ir sensor");
                    client.publish('app/cloud/ir/status','false',[2]);
                    break;
                }
            }
            sendToCloud(data,name);
        }
        else{
            console.log("error validating")
            category1.error("error validating the device "+name);
        }

    }
    else if ( topic === 'app/cloud/ir/data' ){
        const data = message.toString().split('#');
        const name = data[1];
        const flag = await checkValid(data);

        if(flag){
            console.log(name + " is authenticated");
            category2.info(name + " is authenticated");
            console.log(data[2]);
            category2.info(name + ' detected that ' + data[2]);
        }
        else {
            console.log(name +' is not authenticated')
            category2.log('some unauthorized device tried to access network')
        }
    }
          
});


app.listen(3000,()=>{
      console.log("listening on port 3000");
      category3.info("listening on port 3000")
  })

app.post('/temperature/status',(req,res)=>{
      
      var query = url.parse(req.url,true).query;
      console.log(query);
      status = query.status;
      console.log(status);
      client.publish('app/cloud/temperature/status',status,[2]);
      category3.info(name+" asked temp sensor to start taking reading");
      res.writeHead(301,{Location : 'file:///home/niket/edad/main/index.html'});

  });

app.post('/ir/status',(req,res)=>{
      
    var query = url.parse(req.url,true).query;
    console.log(query);
    status = query.status;
    console.log(status);
    client.publish('app/cloud/ir/status',status,[2]);
    category3.info(name+" asked ir sensor to start taking reading");
    res.writeHead(301,{Location : 'file:///home/niket/edad/main/index.html'});

});


function getTime(){
    let time = datetime();

    if (parseInt(time.substr(-2)) > 30 ){
       // console.log(time,time.substr(-2));
        time = time.substr(0,15) + (parseInt(time.substr(15,1))+1);
    }
    else
        time = time.substr(0,16);
    time = time.replace('-','').replace('-','').replace(' ','').replace(':','');

    return time;
}

async function checkValid(add){
    let flag = false;

    let nodes = await Address.getElements();
    if(!nodes) console.log("error")
   else console.log("hello",nodes);

    for (let i = 0; i< nodes.length;i++){

        if ( sha1(nodes[i].substr(0,18)+getTime()) === add[0]  || sha1(nodes[i].substr(0,18)+(parseInt(getTime())-1)) === add[0] || sha1(nodes[i].substr(0,18)+(parseInt(getTime())+1)) === add[0] ){
            flag = true;
            break;
        }
    }
    console.log("flag is ",flag);
    if (!flag) shell.exec('./shell/beep.sh');
    return flag;
}

function setUp(Address, AddressContract){

    if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
    } else {
        // set the provider you want from Web3.providers
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    web3.eth.defaultAccount = web3.eth.accounts[0];
    AddressContract =  web3.eth.contract([
        {
            "constant": false,
            "inputs": [
                {
                    "name": "newAddress",
                    "type": "bytes32"
                }
            ],
            "name": "addMember",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "findAddress",
                    "type": "bytes32"
                }
            ],
            "name": "find",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "getElements",
            "outputs": [
                {
                    "name": "",
                    "type": "bytes32[]"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "MemberAddresses",
            "outputs": [
                {
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ]);
    Address = AddressContract.at('0xf21fa8db88874c89ecfb5073fbcbc5955e4b09d3');
    let get =   Address.getElements();
    console.log(get.length)
    if(get.length == 0){

          Address.addMember('0xa5083168ee1fbee7');
          Address.addMember('0x9ba4a3d5e6586c29');
          Address.addMember('0x518e646dafafb111');
        console.log("adding add to blockchain");
    }
    get =   Address.getElements();
    return [Address,AddressContract];
}




