'use strict'

const modbus = require('jsmodbus');
const net = require('net');
const socket = new net.Socket();
const options = {
  'host': '127.0.0.1',
  'port': '10502'
}
const client = new modbus.client.TCP(socket)

socket.on('connect', function () {
    console.log('connect');
    get();
  
})

const { db } = require("./fb");

async function get(){ //get data from firebase
    const doc = db.collection('tags');
    const observer = doc.onSnapshot(docSnapshot => {//getting realtime changes
        console.log(`Received doc snapshot:`);
        const tags = docSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        tags.forEach(element => {
            console.log('element :>> ', element);
            if(element.fc === 16){// write register
                client.writeSingleRegister(element.address, element.value)
                .then(function (resp) {
                    console.log('write Register :>> ', element.address, element.value);
                    console.log('write Register value :>> ', resp.response.body.value);
                }).catch(function () {
                    console.error(arguments)
                });
            }else if(element.fc === 15){//write coil
                client.writeSingleCoil(element.address, element.value === 1)
                .then(function (resp) {
                    console.log('write coil :>> ', element.address);
                }).catch(function () {
                    console.error(arguments)
                });
            }
        });
    }, err => {
      console.log(`Encountered error: ${err}`);
    });
}

socket.on('error', console.error)
socket.connect(options)