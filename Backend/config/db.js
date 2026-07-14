const db = require('./firebase');

const connectDB = async () => {
    try {
        // Verify connectivity to Firebase Realtime Database
        await db.ref('_conn_test').limitToFirst(1).once('value');
        console.log(`Firebase Realtime Database Connected successfully`);
    } catch (error) {
        console.warn(`Warning: Could not connect to Firebase Realtime Database: ${error.message}`);
        console.warn("Please make sure serviceAccountKey.json is placed in the Backend folder if running locally.");
        // We won't crash the server since it might be starting up in a partial state
    }
};

module.exports = connectDB;
