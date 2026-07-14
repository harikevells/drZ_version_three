const express = require('express');
const router = express.Router();
const {
    createPushNotification,
    getAllPushNotifications,
    getActivePushNotifications,
    updatePushNotification,
    deletePushNotification
} = require('../controllers/pushNotificationController');

router.post('/', createPushNotification);
router.get('/', getAllPushNotifications);
router.get('/active', getActivePushNotifications);
router.put('/:id', updatePushNotification);
router.delete('/:id', deletePushNotification);

module.exports = router;
