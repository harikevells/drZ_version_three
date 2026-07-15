const express = require('express');
const router = express.Router();
const { sendBookingEmail, getBookedTimings, getAllAppointments, getPatientAppointments } = require('../controllers/emailController');

// Public route to send booking emails
router.post('/book', sendBookingEmail);
router.get('/booked-timings', getBookedTimings);
router.get('/all-appointments', getAllAppointments);
router.get('/patient-appointments/:mobile', getPatientAppointments);

module.exports = router;
