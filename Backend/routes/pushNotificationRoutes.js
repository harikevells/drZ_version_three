const express = require('express');
const router = express.Router();
const {
    createPushNotification,
    getAllPushNotifications,
    getActivePushNotifications,
    updatePushNotification,
    deletePushNotification,
    sendCallNotification,
    sendCallToDoctor,
    updateCallStatus,
    getCallStatus
} = require('../controllers/pushNotificationController');

router.post('/', createPushNotification);
router.post('/send-call', sendCallNotification);
router.post('/send-call-to-doctor', sendCallToDoctor);
router.put('/call-status', updateCallStatus);
router.get('/call-status/:bookingId', getCallStatus);
router.get('/', getAllPushNotifications);
router.get('/active', getActivePushNotifications);
router.put('/:id', updatePushNotification);
router.delete('/:id', deletePushNotification);

module.exports = router;
