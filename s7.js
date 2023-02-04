var nodes7 = require('nodes7'); // This is the package name, if the repository is cloned you may need to require 'nodeS7' with uppercase S

const { db } = require("./fb");

var conn = new nodes7;
var doneReading = false;
var doneWriting = false;
var firstLoad = false;
var tags = {};

conn.initiateConnection({ port: 102, host: '192.168.0.100', rack: 0, slot: 2, debug: false }, (err) => {
  if (typeof(err) !== "undefined") {
    // We have an error. Maybe the PLC is not reachable.
    console.log(err);
    process.exit();
  }
  conn.addItems('MR6');
  // conn.writeItems('MR6', 23.3, valuesWritten);
  conn.readAllItems(valuesReady);  
});

function valuesReady(anythingBad, values) {
  if (anythingBad) { console.log("SOMETHING WENT WRONG READING VALUES!!!!"); }
  console.log('values :>> ', values);
  // conn.readAllItems(valuesReady);
  // doneReading = true;
  // if (doneWriting) { process.exit(); }
}

function valuesWritten(anythingBad) {
  if (anythingBad) { console.log("SOMETHING WENT WRONG WRITING VALUES!!!!"); }
  console.log("Done writing.");
  firstLoad = true;
  // doneWriting = true;
  // if (doneReading) { process.exit(); }
}