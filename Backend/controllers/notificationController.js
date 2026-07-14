const Notification = require('../models/Notification');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const admin = require('firebase-admin');

const createNotification = async (role, identifier, title, message, type = 'info') => {
    try {
        const notification = new Notification({
            role,
            identifier,
            title,
            message,
            type,
            isRead: false
        });
        await notification.save();

        let fcmToken = null;
        if (role === 'doctor') {
            let doc = await Doctor.findOne({ email: identifier });
            if (!doc) {
                doc = await Doctor.findOne({ doctorName: identifier });
            }
            if (!doc) {
                // Try case-insensitive search
                const allDocs = await Doctor.find({});
                doc = allDocs.find(d => 
                    (d.doctorName && d.doctorName.toLowerCase() === identifier.toLowerCase()) || 
                    (d.email && d.email.toLowerCase() === identifier.toLowerCase())
                );
            }
            if (doc) fcmToken = doc.fcmToken;
        } else if (role === 'patient') {
            const pat = await Patient.findOne({ identifier: identifier });
            if (pat) fcmToken = pat.fcmToken;
        }

        if (fcmToken) {
            try {
                await admin.messaging().send({
                    token: fcmToken,
                    notification: {
                        title: title,
                        body: message
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default'
                        }
                    },
                    data: {
                        type: type
                    }
                });
                console.log(`Push notification sent successfully to ${role} (${identifier})`);
            } catch (fcmErr) {
                console.error(`Failed to send push notification to ${role} (${identifier}):`, fcmErr);
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
        await Notification.updateMany({ role, identifier }, { isRead: true });
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
