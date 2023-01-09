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

async function get(){
    const doc = db.collection('tags');
    const observer = doc.onSnapshot(docSnapshot => {
        console.log(`Received doc snapshot:`);
        const tags = docSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        // console.log('tags :>> ', tags);
        tags.forEach(element => {
            console.log('element :>> ', element);
            if(element.fc === 16){//register
                // server.holding.writeFloatBE(element.value, 0)

            }else if(element.fc === 15){//coil
                client.writeSingleCoil(element.address, element.value === 1)
                    .then(function (resp) {
                        console.log('write element.address :>> ', element.address);
                    }).catch(function () {
                        console.error(arguments)
                    })

            }
        });
    }, err => {
      console.log(`Encountered error: ${err}`);
    });
}


socket.on('error', console.error)
socket.connect(options)