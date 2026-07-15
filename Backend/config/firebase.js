const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const databaseURL = 'https://drzapp-v3-default-rtdb.asia-southeast1.firebasedatabase.app';

const privateKeyEnv = process.env.private_key || process.env.PRIVATE_KEY;
const clientEmailEnv = process.env.client_email || process.env.CLIENT_EMAIL;
const projectIdEnv = process.env.project_id || process.env.PROJECT_ID;

function cleanEnvVar(val) {
    if (!val) return '';
    let cleaned = val.trim();
    if (cleaned.endsWith(',')) {
        cleaned = cleaned.slice(0, -1).trim();
    }
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
        cleaned = cleaned.slice(1, -1);
    }
    return cleaned.replace(/\\n/g, '\n').trim();
}

if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL
        });
        console.log("Firebase Admin initialized using serviceAccountKey.json");
    } catch (err) {
        console.error("Error parsing serviceAccountKey.json:", err.message);
        process.exit(1);
    }
} else if (privateKeyEnv && clientEmailEnv && projectIdEnv) {
    try {
        const privateKey = cleanEnvVar(privateKeyEnv);
        const clientEmail = cleanEnvVar(clientEmailEnv);
        const projectId = cleanEnvVar(projectIdEnv);

        console.log("DEBUG: privateKey cleaned starts with:", JSON.stringify(privateKey.substring(0, 40)));
        console.log("DEBUG: privateKey cleaned ends with:", JSON.stringify(privateKey.substring(privateKey.length - 40)));
        console.log("DEBUG: privateKey cleaned has actual newlines:", privateKey.includes('\n'));

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey
            }),
            databaseURL
        });
        console.log("Firebase Admin initialized using individual environment variables");
    } catch (err) {
        console.error("Error initializing Firebase Admin with individual env variables:", err.message);
        process.exit(1);
    }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL
        });
        console.log("Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT environment variable");
    } catch (err) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:", err.message);
        process.exit(1);
    }
} else {
    try {
        admin.initializeApp({
            projectId: 'drzapp-v3',
            databaseURL
        });
        console.log("Firebase Admin initialized with default project ID");
    } catch (err) {
        console.error("Firebase Initialization Error: serviceAccountKey.json was not found.");
        console.error("Please download it from Firebase Console (Settings -> Service Accounts -> Generate new private key) and place it in the Backend folder.");
        process.exit(1);
    }
}

const db = admin.database();
module.exports = db;
