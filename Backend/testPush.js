const mongoose = require('mongoose');
const { adminMessaging } = require('./config/firebase');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
require('dotenv').config();

async function testPush() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/drz');
        console.log("Connected to MongoDB.");

        const doctor = await Doctor.findOne({ fcmToken: { $exists: true, $ne: null } });
        if (doctor) {
            console.log(`Found doctor ${doctor.doctorName} with token: ${doctor.fcmToken}`);
            try {
                await adminMessaging.send({
                    token: doctor.fcmToken,
                    notification: {
                        title: "Test Doctor Push",
                        body: "This is a test notification for the doctor."
                    }
                });
                console.log("Successfully sent push to Doctor.");
            } catch (err) {
                console.log("Failed to send push to Doctor:", err.message);
            }
        } else {
            console.log("No doctor found with an fcmToken.");
        }

        const patient = await Patient.findOne({ fcmToken: { $exists: true, $ne: null } });
        if (patient) {
            console.log(`Found patient ${patient.identifier} with token: ${patient.fcmToken}`);
            try {
                await adminMessaging.send({
                    token: patient.fcmToken,
                    notification: {
                        title: "Test Patient Push",
                        body: "This is a test notification for the patient."
                    }
                });
                console.log("Successfully sent push to Patient.");
            } catch (err) {
                console.log("Failed to send push to Patient:", err.message);
            }
        } else {
            console.log("No patient found with an fcmToken.");
        }

    } catch (err) {
        console.log("Error:", err);
    } finally {
        process.exit(0);
    }
}

testPush();
