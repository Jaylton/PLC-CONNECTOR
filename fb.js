const { getFirestore } = require("firebase-admin/firestore");
var admin = require('firebase-admin');    
var serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ourmoney-fa977.firebaseio.com'
});

// const { initializeApp } = require("firebase-admin/app");
// const defaultAppConfig = {
//     apiKey: "AIzaSyBdYhd3xpr_HVwUNdtWdpj3FY7awWe0sYY",
//     authDomain: "ourmoney-fa977.firebaseapp.com",
//     databaseURL: "https://ourmoney-fa977.firebaseio.com",
//     projectId: "ourmoney-fa977",
//     storageBucket: "ourmoney-fa977.appspot.com",
//     messagingSenderId: "253615453865",
//     appId: "1:253615453865:web:862ad6e5d71581d5d2dbb8",
//     measurementId: "G-B8JT1CCQV4"
// };
// initializeApp(defaultAppConfig);

const db = getFirestore();

module.exports = {
  db,
};