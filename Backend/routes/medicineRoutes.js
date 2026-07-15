const express = require('express');
const router = express.Router();
const { createMedicine, getAllMedicines, updateMedicine, deleteMedicine } = require('../controllers/medicineController');

router.post('/', createMedicine);
router.get('/', getAllMedicines);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

module.exports = router;
