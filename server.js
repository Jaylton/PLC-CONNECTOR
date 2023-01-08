'use strict'

//como escrever no modbus?

const net = require('net')
const modbus = require('jsmodbus')
const netServer = new net.Server()
const holding = Buffer.alloc(10000)
const server = new modbus.server.TCP(netServer, {
  holding: holding
});

const { db } = require("./fb");

async function get(){
    const doc = db.collection('tags');
    const observer = doc.onSnapshot(docSnapshot => {
        console.log(`Received doc snapshot:`);
        const tags = docSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        console.log('tags :>> ', tags);
    }, err => {
      console.log(`Encountered error: ${err}`);
    });
}
async function post(value, address){
    await db.collection("tags").add({
        name: 'test post',
        value,
        address
      });
}
server.on('connection', function (client) {
    console.log('New Connection')
    // get();
    // post();
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

server.on('preWriteSingleRegister', function (value, address) {
    console.log('Write Single Register')
    console.log('Original {register, value}: {', address, ',', server.holding.readUInt16BE(address), '}')
})

server.on('WriteSingleRegister', function (value, address) {
    console.log('New {register, value}: {', address, ',', server.holding.readUInt16BE(address), '}')
})

server.on('writeMultipleCoils', function (value) {
    console.log('Write multiple coils - Existing: ', value)
})

server.on('postWriteMultipleCoils', function (value) {
    try {
        console.log();
        if(value._body){
            console.log('value :>> ', value._body);
            console.log('value._body._address :>> ', value._body._address);
            let arr = [...value._body._values];
            console.log('_values :>> ', arr);
            post(arr[0], value._body._address)
        }
        
    } catch (error) {
        console.log('error :>> ', error);
    }
})

/* server.on('writeMultipleRegisters', function (value) {
  console.log('Write multiple registers - Existing: ', value)
}) */

server.on('postWriteMultipleRegisters', function (value) {
  console.log('Write multiple registers - Complete: ', holding.readUInt16BE(0))
})

server.on('connection', function (client) {

  /* work with the modbus tcp client */

})

server.coils.writeUInt16BE(0x0000, 0)
server.coils.writeUInt16BE(0x0000, 2)
server.coils.writeUInt16BE(0x0000, 4)
server.coils.writeUInt16BE(0x0000, 6)

server.discrete.writeUInt16BE(0x5678, 0)

server.holding.writeUInt16BE(0x0000, 0)
server.holding.writeUInt16BE(0x0000, 2)

server.input.writeUInt16BE(0xff00, 0)
server.input.writeUInt16BE(0xff00, 2)

console.log('port: '+10502)
netServer.listen(10502)
