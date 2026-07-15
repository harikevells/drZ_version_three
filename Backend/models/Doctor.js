const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const doctorSchema = new mongoose.Schema({
    doctorName: { type: String, required: true },
    gender: { type: String, required: true },
    department: { type: String, required: true },
    experience: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },
    fcmToken: { type: String },
    activeStatus: { type: Boolean, default: true }
}, { timestamps: true });

// Pre-save hook to hash password before saving if it's modified or new
doctorSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Override toJSON to map _id to id to match frontend expectation seamlessly and hide password
doctorSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.password;
    }
});

// Method to compare passwords
doctorSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Doctor', doctorSchema);
