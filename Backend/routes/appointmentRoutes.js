const express = require('express');
const router = express.Router();
const { getDoctorDashboard, updateAppointmentStatus, updateAppointmentPrescription, getAllDoctorAppointments, getBookedTimingsByDate, exportDoctorAppointments, getAdminDashboard } = require('../controllers/appointmentController');

router.get('/admin-dashboard', getAdminDashboard);
router.get('/dashboard/:doctorName', getDoctorDashboard);
router.get('/all/:doctorName', getAllDoctorAppointments);
router.get('/export/:doctorName', exportDoctorAppointments);
router.get('/booked/:doctorName/:date', getBookedTimingsByDate);
router.put('/:id/status', updateAppointmentStatus);
router.put('/:id/prescription', updateAppointmentPrescription);

module.exports = router;
