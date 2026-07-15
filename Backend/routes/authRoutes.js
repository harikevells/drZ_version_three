const express = require('express');
const router = express.Router();
const { login, doctorLogin, patientRegister, patientLogin } = require('../controllers/authController');

router.post('/login', login);
router.post('/doctor/login', doctorLogin);
router.post('/patient/register', patientRegister);
router.post('/patient/login', patientLogin);

module.exports = router;
