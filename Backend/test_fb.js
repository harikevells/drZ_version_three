const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const databaseURL = 'https://drzapp-v3-default-rtdb.asia-southeast1.firebasedatabase.app';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL
});

const db = admin.database();

db.ref('_conn_test').limitToFirst(1).once('value')
    .then(() => {
        console.log("Connected successfully to", databaseURL);
        process.exit(0);
    })
    .catch(err => {
        console.error("Error connecting:", err.message);
        process.exit(1);
    });
