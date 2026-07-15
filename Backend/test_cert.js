const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const databaseURL = 'https://drzapp-v3-default-rtdb.asia-southeast1.firebasedatabase.app';

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key
        }),
        databaseURL
    });
    
    const db = admin.database();
    db.ref('_conn_test').limitToFirst(1).once('value')
        .then(() => {
            console.log("Connected successfully using camelCase fields!");
            process.exit(0);
        })
        .catch(err => {
            console.error("Error connecting:", err.message);
            process.exit(1);
        });
} catch(e) {
    console.error("Error initializing:", e.message);
    process.exit(1);
}
