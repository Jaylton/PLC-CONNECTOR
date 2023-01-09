'use strict'

//como escrever no modbus?

const net = require('net')
const modbus = require('jsmodbus')
const netServer = new net.Server()
const holding = Buffer.alloc(10000)
const server = new modbus.server.TCP(netServer, {
  holding: holding,
//   coils: Buffer.from([0x55, 0x55, 0x55])
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
        // console.log('tags :>> ', tags);
        tags.forEach(element => {
            console.log('element :>> ', element);
            if(element.fc === 16){//register
                // server.holding.writeFloatBE(element.value, 0)

            }else if(element.fc === 15){//coil
                // server.coils.writeUInt16BE(element.value, 0)

            }
        });
    }, err => {
      console.log(`Encountered error: ${err}`);
    });
}
async function post(value, address, fc){
    await db.collection("tags").doc(fc+'-'+address).set({
        name: 'test post',
        value,
        fc,
        address
      });
}
server.on('connection', function (client) {
    console.log('New Connection')
    get();
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

// server.on('preWriteSingleRegister', function (value, address) {
//     console.log('Write Single Register')
//     console.log('Original {register, value}: {', address, ',', server.holding.readUInt16BE(address), '}')
// })

// server.on('WriteSingleRegister', function (value, address) {
//     console.log('New {register, value}: {', address, ',', server.holding.readUInt16BE(address), '}')
// })

// server.on('writeMultipleCoils', function (value) {
//     console.log('Write multiple coils - Existing: ', value)
// })

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

/* server.on('writeMultipleRegisters', function (value) {
  console.log('Write multiple registers - Existing: ', value)
}) */

server.on('postWriteMultipleRegisters', function (value) {
    try {
        console.log();
        if(value._body){  
            const address = value._body._address;
            const fc = value._body._fc;
            console.log('fc :>> ', fc);
            console.log('address :>> ', address);
            const val = value._body._values.readFloatBE()
            console.log('val :>> ', val);
            post(val, address, fc);
        }
    } catch (error) {
        console.log('error :>> ', error);
    }
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
