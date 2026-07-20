const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://drzapp-v3-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
}
const db = admin.database();

const daysOptions = [
    { title: '1 Day', status: 'Active' },
    { title: '2 Days', status: 'Active' },
    { title: '3 Days', status: 'Active' },
    { title: '4 Days', status: 'Active' },
    { title: '5 Days', status: 'Active' },
    { title: '1 Week', status: 'Active' },
    { title: '2 Weeks', status: 'Active' },
    { title: '1 Month', status: 'Active' },
];

async function seedDays() {
    console.log("Seeding Medicine Days...");
    for (const option of daysOptions) {
        await db.ref('medicine_days').push(option);
    }
    console.log("Seeding complete!");
    process.exit(0);
}

seedDays();
