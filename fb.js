const { getFirestore } = require("firebase-admin/firestore");
var admin = require('firebase-admin');    
var serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ourmoney-fa977.firebaseio.com'
});

const db = getFirestore();

module.exports = {
  db,
};