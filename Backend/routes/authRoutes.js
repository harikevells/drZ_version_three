const express = require('express');
const router = express.Router();
const { login, doctorLogin, patientRegister, patientLogin, updateFcmToken } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/doctor/login', doctorLogin);
router.post('/patient/register', patientRegister);
router.post('/patient/login', patientLogin);
router.put('/fcm-token', protect, updateFcmToken);

module.exports = router;
