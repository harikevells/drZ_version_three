const { onRequest } = require('firebase-functions/v2/https');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

// Connect to database and seed admin
connectDB().then(async () => {
    try {
        const adminEmail = 'admin@drz.com';
        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            await User.create({
                email: adminEmail,
                password: 'Admin@123'
            });
            console.log('Default Admin user seeded');
        }
    } catch (err) {
        console.error('Error seeding admin user:', err);
    }
});

const app = require('./app');

// Initialize dynamic email scheduling jobs
const { initCronJobs } = require('./cron/scheduler');
initCronJobs();

// If running locally, start the listener
if (!process.env.FUNCTIONS_EMULATOR && !process.env.FIREBASE_CONFIG) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Local Server is running on port ${PORT}`);
    });
}

// Export the Express app as a Firebase Cloud Function in asia-south1 region
exports.api = onRequest({ region: 'asia-south1', cors: true, maxInstances: 10 }, app);
