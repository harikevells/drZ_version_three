const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/', roomController.getAllRooms);
router.post('/', roomController.createRoom);
router.put('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);
router.post('/:id/admit', roomController.admitPatient);
router.post('/:id/discharge', roomController.dischargePatient);

module.exports = router;
