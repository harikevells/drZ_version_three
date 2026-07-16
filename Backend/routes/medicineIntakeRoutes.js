const express = require('express');
const router = express.Router();
const { createIntake, getAllIntakes, updateIntake, deleteIntake } = require('../controllers/medicineIntakeController');

router.post('/', createIntake);
router.get('/', getAllIntakes);
router.put('/:id', updateIntake);
router.delete('/:id', deleteIntake);

module.exports = router;
