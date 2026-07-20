const express = require('express');
const router = express.Router();
const { createDay, getAllDays, updateDay, deleteDay } = require('../controllers/medicineDayController');

router.post('/', createDay);
router.get('/', getAllDays);
router.put('/:id', updateDay);
router.delete('/:id', deleteDay);

module.exports = router;
