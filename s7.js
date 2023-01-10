var nodes7 = require('nodes7'); // This is the package name, if the repository is cloned you may need to require 'nodeS7' with uppercase S

const { db } = require("./fb");

var conn = new nodes7;
var doneReading = false;
var doneWriting = false;
var firstLoad = false;
var tags = {};

conn.initiateConnection({ port: 102, host: '192.168.0.103', rack: 0, slot: 2, debug: false }, (err) => {
  if (typeof(err) !== "undefined") {
    // We have an error. Maybe the PLC is not reachable.
    console.log(err);
    process.exit();
  }
  get();
  setInterval(() => {
    if(firstLoad){
      conn.readAllItems(valuesReady);
    }
  }, 500);
  
});

function get(){ //get data from firebase
  const doc = db.collection('tags_s7');
  doc.onSnapshot(docSnapshot => {//getting realtime changes
      console.log(`Received doc snapshot:`);
      const tag_list = docSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
      }));
      let object = {};
      if(tag_list.length === 0){
        firstLoad = true;
      }
      tag_list.forEach(element => {
          object[element.id] = element.value;
      });
      var changedTags = getChangedTags(object);
      var labels = Object.keys(changedTags);
      var values = Object.values(changedTags);
      
      if(labels.length > 0 && values.length > 0){
        conn.addItems(labels);
        conn.writeItems(labels, values, valuesWritten);
      }
      console.log('changedTags :>> ', changedTags);

  }, err => {
    console.log(`Encountered error: ${err}`);
  });
}

function post(values){
  var batch = db.batch();
  Object.keys(values).forEach((el, i) => {
    const doc = {
      address: el,
      value: values[el]
    }
    batch.set(db.collection('tags_s7').doc(el), doc);
  });

  batch.commit().then(function () {
     console.log('batch ok');
  });
}

function getChangedTags(values){
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
  return changedTags;
}

function valuesReady(anythingBad, values) {
  if (anythingBad) { console.log("SOMETHING WENT WRONG READING VALUES!!!!"); }
  var changedTags = getChangedTags(values);
  if(firstLoad && Object.keys(changedTags).length > 0){
    post(changedTags)
  }
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