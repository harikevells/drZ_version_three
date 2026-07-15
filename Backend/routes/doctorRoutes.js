const express = require('express');
const router = express.Router();
const { getDoctors, createDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctorController');
const authenticateToken = require('../middleware/authMiddleware');

// Public route to get doctors
router.get('/', getDoctors);

// Protect the following routes
router.use(authenticateToken);

router.post('/', createDoctor);

router.route('/:id')
    .put(updateDoctor)
    .delete(deleteDoctor);

module.exports = router;
