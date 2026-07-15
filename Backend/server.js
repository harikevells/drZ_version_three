const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

// Connect to MongoDB and seed admin
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
const PORT = process.env.PORT || 5000;

// Initialize dynamic email scheduling jobs
const { initCronJobs } = require('./cron/scheduler');
initCronJobs();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
