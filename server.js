'use strict'

const net = require('net')
const modbus = require('jsmodbus')
const netServer = new net.Server()
const holding = Buffer.alloc(10000)
const server = new modbus.server.TCP(netServer, {
  holding: holding,
});
require('./client.js');

const { db } = require("./fb");

async function post(value, address, fc){
    await db.collection("tags").doc(fc+'-'+address).set({ //save tags
        value,
        fc,
        address
      });
}
server.on('connection', function (client) {
    console.log('New Connection')
})

server.on('readCoils', function (request, response, send) {
  /* Implement your own */
  console.log('response :>> ', response);

//   response.body.coils[0] = true
//   response.body.coils[1] = false

//   send(response)
})

server.on('readHoldingRegisters', function (request, response, send) {

  /* Implement your own */

})

server.on('postWriteMultipleCoils', function (value) {
    try {
        console.log();
        if(value._body){
            const address = value._body._address;
            const fc = value._body._fc;
            console.log('fc :>> ', fc);
            console.log('address :>> ', address);
            let arr = [...value._body._values];
            console.log('value._body._values :>> ', arr);
            const val = arr[0];
            post(val, address, fc);
        }
        
    } catch (error) {
        console.log('error :>> ', error);
    }
})

server.on('postWriteMultipleRegisters', function (value) {
    try {
        console.log();
        if(value._body){  
            const address = value._body._address;
            const fc = value._body._fc;
            console.log('fc :>> ', fc);
            console.log('address :>> ', address);
            const val = value._body._values.readInt16BE()
            console.log('val :>> ', val);
            post(val, address, fc);
        }
    } catch (error) {
        console.log('error :>> ', error);
    }
})

// server.holding.writeUInt16BE(0x0000, 0)
// server.holding.writeUInt16BE(0x0000, 2)

// server.input.writeUInt16BE(0xff00, 0)
// server.input.writeUInt16BE(0xff00, 2)

console.log('port: '+10502)
netServer.listen(10502)
