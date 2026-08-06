const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const emailRoutes = require('./routes/emailRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pushNotificationRoutes = require('./routes/pushNotificationRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const medicineTimingRoutes = require('./routes/medicineTimingRoutes');
const medicineIntakeRoutes = require('./routes/medicineIntakeRoutes');
const medicineDayRoutes = require('./routes/medicineDayRoutes');
const accountRoutes = require('./routes/accountRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoints for Render load balancer
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/', (req, res) => res.status(200).send('OK'));

// Support both local server and Firebase cloud function prefixes
app.use((req, res, next) => {
    if (!req.url.startsWith('/api')) {
        req.url = '/api' + req.url;
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push-notifications', pushNotificationRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/medicine-timings', medicineTimingRoutes);
app.use('/api/medicine-intakes', medicineIntakeRoutes);
app.use('/api/medicine-days', medicineDayRoutes);
const razorpayRoutes = require('./routes/razorpayRoutes');
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/accounts', accountRoutes);

module.exports = app;
