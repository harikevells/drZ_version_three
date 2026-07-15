const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '1d' });
            res.json({ token, user: { email: user.email } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const doctorLogin = async (req, res) => {
    const { email, password, fcmToken } = req.body;
    console.log(`\n[Doctor Login Attempt] Email: "${email}", Password: "${password}"`);
    try {
        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            console.log(`[Doctor Login Failed] No doctor found with email: "${email}"`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!doctor.activeStatus) {
            console.log(`[Doctor Login Failed] Account is inactive for email: "${email}"`);
            return res.status(403).json({ error: 'Account is inactive' });
        }

        const isMatch = await doctor.matchPassword(password);
        if (isMatch) {
            console.log(`[Doctor Login Success] Logged in successfully: "${email}"`);
            
            // Save FCM token if provided
            if (fcmToken) {
                await Doctor.findByIdAndUpdate(doctor._id, { fcmToken });
                console.log(`[FCM Token] Saved for doctor: "${email}"`);
            }

            const token = jwt.sign({ id: doctor._id, email: doctor.email, role: 'doctor' }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '7d' });
            res.json({ token, user: { id: doctor._id, email: doctor.email, doctorName: doctor.doctorName, department: doctor.department } });
        } else {
            console.log(`[Doctor Login Failed] Password mismatch for email: "${email}"`);
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(`[Doctor Login Error] ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

const patientRegister = async (req, res) => {
    const { identifier, password, fcmToken } = req.body;
    try {
        const existing = await Patient.findOne({ identifier });
        if (existing) {
            return res.status(400).json({ error: 'Patient already exists with this email/number' });
        }
        
        const newPatientData = { identifier, password, role: 'patient' };
        if (fcmToken) newPatientData.fcmToken = fcmToken;
        
        const patient = await Patient.create(newPatientData);
        const token = jwt.sign({ id: patient._id, identifier: patient.identifier, role: patient.role }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '7d' });
        res.json({ token, user: { id: patient._id, identifier: patient.identifier, role: patient.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const patientLogin = async (req, res) => {
    const { identifier, password, fcmToken } = req.body;
    try {
        const patient = await Patient.findOne({ identifier });
        if (!patient) return res.status(401).json({ error: 'Invalid credentials' });
        
        const isMatch = await patient.matchPassword(password);
        if (isMatch) {
            // Save FCM token if provided
            if (fcmToken) {
                await Patient.findByIdAndUpdate(patient._id, { fcmToken });
                console.log(`[FCM Token] Saved for patient: "${identifier}"`);
            }

            const token = jwt.sign({ id: patient._id, identifier: patient.identifier, role: patient.role }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '7d' });
            res.json({ token, user: { id: patient._id, identifier: patient.identifier, role: patient.role } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { login, doctorLogin, patientRegister, patientLogin };
