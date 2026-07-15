const express = require('express');
const router = express.Router();
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const authenticateToken = require('../middleware/authMiddleware');

// Public route to get schedules
router.get('/', getSchedules);

router.use(authenticateToken);

router.post('/', createSchedule);

router.route('/:id')
    .put(updateSchedule)
    .delete(deleteSchedule);

module.exports = router;
