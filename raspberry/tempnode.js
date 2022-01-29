const mqtt = require('mqtt');
//const client  = mqtt.connect('mqtt://test.mosquitto.org');
const client  = mqtt.connect('mqtt://mwvzrddu:0JBtMaIMrFm2@m15.cloudmqtt.com:10738');
const datetime = require('date-time');
const random = require ('randomatic');
const sha1 = require('sha1');
const address = '0xa5083168ee1fbee7';
const name = 'raspberry1';
let status = false;




function sendData(){
    //console.log("inside",status);
  
    
    setInterval(()=>{
        if (status == 'true'){
            const data = takeData();
            //console.log("published data",data)
            const id = sha1(address+getTime());
            client.publish('app/cloud/temperature/data',id + '&'+ name +'&' + data);
        }
    },20000);
    
}



function takeData(){
    let data = '';

    for(var i = 0; i < 20 ; i++) {
        data = data + 2000 + "#" + random('?',1,{chars : '01234'}) + random('?',1,{chars : '0123456789'}) + '/'; 
    }
    
    //console.log(data);
    return data;
}



client.on('connect', function () {
    client.subscribe(['app/cloud/temperature/status','app/cloud/temperature/data']);
    console.log('connected to mqtt server');
    }
);


client.on('message', function (topic, message) {
    // message is Buffer
    if(topic === 'app/cloud/temperature/status'){
        status = message.toString();
        sendData();
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


function test (){
    setInterval(()=>{
        console.log("done")
        client.publish('app/cloud/ir/status','false');
    },20000)
}

//test();