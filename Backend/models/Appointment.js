const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient_name: { type: String, required: true },
    patient_age: { type: String, required: true },
    patient_gender: { type: String, required: true },
    whatsapp_number: { type: String },
    login_mobile: { type: String },
    treatment_category: { type: String, required: true },
    doctor_name: { type: String, required: true },
    appointment_date: { type: String, required: true },
    appointment_time: { type: String, required: true },
    video_call: { type: String, default: 'No' },
    status: { type: String, default: 'Pending' }
}, { timestamps: true });

// Ensure id maps correctly for frontend consumption if needed
appointmentSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
