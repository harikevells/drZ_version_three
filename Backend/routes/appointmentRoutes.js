const express = require('express');
const router = express.Router();
const { getDoctorDashboard, updateAppointmentStatus, updatePaymentStatus, updatePaymentMethod, updateAppointmentPrescription, getAllDoctorAppointments, getBookedTimingsByDate, exportDoctorAppointments, getAdminDashboard } = require('../controllers/appointmentController');

router.get('/admin-dashboard', getAdminDashboard);
router.get('/dashboard/:doctorName', getDoctorDashboard);
router.get('/all/:doctorName', getAllDoctorAppointments);
router.get('/export/:doctorName', exportDoctorAppointments);
router.get('/booked/:doctorName/:date', getBookedTimingsByDate);
router.put('/:id/status', updateAppointmentStatus);
router.put('/:id/payment-status', updatePaymentStatus);
router.put('/:id/payment-method', updatePaymentMethod);
router.put('/:id/prescription', updateAppointmentPrescription);

module.exports = router;
