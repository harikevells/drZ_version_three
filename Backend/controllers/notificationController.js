const Notification = require('../models/Notification');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { adminMessaging } = require('../config/firebase');

// Create a new notification
const createNotification = async (role, identifier, title, message, type = 'info') => {
    try {
        const notification = new Notification({
            role,
            identifier,
            title,
            message,
            type
        });
        await notification.save();

        // Send Push Notification via Firebase Admin
        if (role === 'doctor') {
            const doctor = await Doctor.findOne({ doctorName: identifier });
            if (doctor && doctor.fcmToken) {
                const payload = {
                    notification: {
                        title: title,
                        body: message
                    },
                    data: {
                        type: type,
                        message: message
                    },
                    android: {
                        priority: 'high'
                    },
                    token: doctor.fcmToken
                };
                try {
                    await adminMessaging.send(payload);
                    console.log(`Push notification sent to doctor ${identifier}`);
                } catch (err) {
                    console.error('Error sending push notification to doctor:', err.message);
                }
            }
        } else if (role === 'patient') {
            const patient = await Patient.findOne({ identifier: identifier });
            if (patient && patient.fcmToken) {
                const payload = {
                    notification: {
                        title: title,
                        body: message
                    },
                    data: {
                        type: type,
                        message: message
                    },
                    android: {
                        priority: 'high'
                    },
                    token: patient.fcmToken
                };
                try {
                    await adminMessaging.send(payload);
                    console.log(`Push notification sent to patient ${identifier}`);
                } catch (err) {
                    console.error('Error sending push notification to patient:', err.message);
                }
            }
        }

        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

// Get notifications for a user/role
const getNotifications = async (req, res) => {
    try {
        const { role, identifier } = req.params;
        
        const notifications = await Notification.find({ role, identifier })
                                              .sort({ createdAt: -1 })
                                              .limit(50);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: "Failed to update notification", error: error.message });
    }
};

// Mark all as read for a specific user
const markAllAsRead = async (req, res) => {
    try {
        const { role, identifier } = req.params;
        await Notification.updateMany({ role, identifier, isRead: false }, { isRead: true });
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update notifications", error: error.message });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead
};
