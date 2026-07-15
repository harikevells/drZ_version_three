const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    department: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: [String], required: true },
    status: { type: String, default: 'Pending' }
}, { timestamps: true });

// Override toJSON to map _id to id to match frontend expectation seamlessly
scheduleSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
