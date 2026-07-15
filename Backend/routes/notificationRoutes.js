const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/:role/:identifier', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/readAll/:role/:identifier', markAllAsRead);

module.exports = router;
