const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const databaseURL = 'https://drz-project-53e74-default-rtdb.firebaseio.com';

let app;

if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = require(serviceAccountPath);
        app = initializeApp({
            credential: cert(serviceAccount),
            databaseURL
        });
        console.log("Firebase Admin initialized using serviceAccountKey.json");
    } catch (err) {
        console.error("Error parsing serviceAccountKey.json:", err.message);
        process.exit(1);
    }
} else {
    try {
        app = initializeApp({
            projectId: 'drz-project-53e74',
            databaseURL
        });
        console.log("Firebase Admin initialized with default project ID");
    } catch (err) {
        console.error("Firebase Initialization Error: serviceAccountKey.json was not found.");
        process.exit(1);
    }
}

const adminMessaging = getMessaging(app);

module.exports = {
    adminMessaging
};
