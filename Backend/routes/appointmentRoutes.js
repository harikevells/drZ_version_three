const express = require('express');
const router = express.Router();
const { getDoctorDashboard, updateAppointmentStatus, getAllDoctorAppointments, getBookedTimingsByDate, exportDoctorAppointments } = require('../controllers/appointmentController');

router.get('/dashboard/:doctorName', getDoctorDashboard);
router.get('/all/:doctorName', getAllDoctorAppointments);
router.get('/export/:doctorName', exportDoctorAppointments);
router.get('/booked/:doctorName/:date', getBookedTimingsByDate);
router.put('/:id/status', updateAppointmentStatus);

module.exports = router;
