const admin = require('firebase-admin');
const db = require('./config/firebase');
const Patient = require('./models/Patient');

async function testPush() {
    try {
        const patients = await Patient.find({});
        console.log(`Found ${patients.length} patients.`);
        const validTokens = patients.filter(p => p.fcmToken && p.fcmToken.length > 10).map(p => p.fcmToken);
        console.log(`Found ${validTokens.length} valid FCM tokens.`);
        
        if (validTokens.length > 0) {
            const token = validTokens[0];
            console.log(`Testing with token: ${token.substring(0, 20)}...`);
            
            const message = {
                token: token,
                notification: {
                    title: 'Test Push',
                    body: 'This is a test notification'
                }
            };
            
            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
        } else {
            console.log("No valid FCM tokens found in DB to test.");
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
    process.exit(0);
}

testPush();
