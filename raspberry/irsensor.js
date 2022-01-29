const mqtt = require('mqtt');
const client  = mqtt.connect('mqtt://mwvzrddu:0JBtMaIMrFm2@m15.cloudmqtt.com:10738');
const datetime = require('date-time');
const random = require ('randomatic');
const sha1 = require('sha1');
const address = '0x9ba4a3d5e6586c29';
const name = 'raspberry 2';
let status = 'false';




function startIR(){
    console.log("inside",status);
    //client.publish('app/cloud/ir/data',sha1(address+getTime())+'#'+name+'#'+'Intruder detected');


    setInterval(()=>{
        if(status == 'true'){
            console.log('ji');
            client.publish('app/cloud/ir/data',sha1(address+getTime())+'#'+name+'#'+'Intruder detected');
        }
        else{
            clearInterval();
        }
    },10000);
    
}



client.on('connect', function () {
    client.subscribe(['app/cloud/ir/status','app/cloud/ir/data']);
    console.log('connected to mqtt server');
    }
);


client.on('message', function (topic, message) {
    // message is Buffer
    if(topic === 'app/cloud/ir/status'){
        //console.log(status == 'flals');
        if( status === 'false' && message.toString() == 'true'){
            //console.log(message);
            status = 'true' 
            startIR();
        }
        status = message.toString();
        //startIR();
        console.log(status,message.toString());
    }
  })


function getTime(){
    let time = datetime();
    //console.log(time.substr(15,1));
    if (parseInt(time.substr(-2)) > 30 ){
        //console.log(time,time.substr(-2));
        time = time.substr(0,15) + (parseInt(time.substr(15,1))+1);
    }
    else
        time = time.substr(0,16);
    time = time.replace('-','').replace('-','').replace(' ','').replace(':','');
    //console.log(time);
    return time;
}
//takeData()


