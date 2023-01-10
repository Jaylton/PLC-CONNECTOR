var nodes7 = require('nodes7'); // This is the package name, if the repository is cloned you may need to require 'nodeS7' with uppercase S
var conn = new nodes7;
var doneReading = false;
var doneWriting = false;
var tags = {};

var variables = {
      TEST2: 'M0.0',        // Bit at M32.2
      TEST3: 'M0.1',        // Bit at M20.0
      TEST4: 'M0.2',        // Bit at M20.0
};

conn.initiateConnection({ port: 102, host: '192.168.0.103', rack: 0, slot: 2, debug: false }, connected); // slot 2 for 300/400, slot 1 for 1200/1500, change debug to true to get more info
// conn.initiateConnection({port: 102, host: '192.168.0.2', localTSAP: 0x0100, remoteTSAP: 0x0200, timeout: 8000, doNotOptimize: true}, connected);
// local and remote TSAP can also be directly specified instead. The timeout option specifies the TCP timeout.

function connected(err) {
  if (typeof(err) !== "undefined") {
    // We have an error. Maybe the PLC is not reachable.
    console.log(err);
    process.exit();
  }
  conn.setTranslationCB(function(tag) { return variables[tag]; }); // This sets the "translation" to allow us to work with object names
  conn.setTranslationCB(function(tag) { return variables[tag]; }); // This sets the "translation" to allow us to work with object names
  conn.addItems('TEST4');
  setInterval(() => {
    conn.readAllItems(valuesReady);
  }, 500);
}

function valuesReady(anythingBad, values) {
  if (anythingBad) { console.log("SOMETHING WENT WRONG READING VALUES!!!!"); }
  var tagsOld = JSON.parse(JSON.stringify(tags));
  tags = values;
  var changedTags = {};
  for (let i = 0; i < Object.keys(tags).length; i++) {
    const key = Object.keys(tags)[i];
    const value = Object.values(tags)[i];
    if(!(key in tagsOld) || value !== tagsOld[key]){
      changedTags[key] = Object.values(tags)[i];
    }
    
  }
  if(Object.keys(changedTags).length > 0){
    console.log('changedTags', changedTags);
  }
  // conn.readAllItems(valuesReady);
  // doneReading = true;
  // if (doneWriting) { process.exit(); }
}

function valuesWritten(anythingBad) {
  if (anythingBad) { console.log("SOMETHING WENT WRONG WRITING VALUES!!!!"); }
  console.log("Done writing.");
  doneWriting = true;
  if (doneReading) { process.exit(); }
}