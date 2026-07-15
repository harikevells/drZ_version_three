const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    role: { 
        type: String, 
        enum: ['admin', 'doctor', 'patient'], 
        required: true 
    },
    identifier: { 
        type: String, 
        required: true 
    }, // 'admin' for Admin, DoctorName for Doctor
    title: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    },
    type: { 
        type: String, 
        default: 'info' 
    }
}, { timestamps: true });

// Transform to clean JSON format
notificationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
