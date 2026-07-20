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
    const { email, password } = req.body;
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
            const token = jwt.sign({ id: doctor._id, email: doctor.email, role: 'doctor' }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '7d' });
            res.json({ token, user: { id: doctor.id, email: doctor.email, doctorName: doctor.doctorName, department: doctor.department } });
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
    const { 
        identifier, 
        password, 
        patient_name, 
        patient_age, 
        blood_group, 
        emergency_contact, 
        street, 
        area, 
        district, 
        state,
        profileImage 
    } = req.body;
    console.log("[Backend patientRegister] Received payload:", {
        identifier,
        patient_name,
        patient_age,
        blood_group,
        emergency_contact,
        street,
        area,
        district,
        state,
        hasProfileImage: !!profileImage,
        profileImageSnippet: profileImage ? profileImage.substring(0, 100) : null
    });
    try {
        const existing = await Patient.findOne({ identifier });
        if (existing) {
            return res.status(400).json({ error: 'Patient already exists with this email/number' });
        }
        const patientCount = await Patient.countDocuments();
        const patient_id = `Pat${String(patientCount + 1).padStart(4, '0')}`;

        const patient = await Patient.create({ 
            identifier, 
            password, 
            role: 'patient', 
            patient_id,
            patient_name,
            patient_age,
            blood_group,
            emergency_contact,
            street,
            area,
            district,
            state,
            profileImage
        });
        const token = jwt.sign({ id: patient._id, identifier: patient.identifier, role: patient.role }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '7d' });
        res.json({ 
            token, 
            user: { 
                id: patient._id, 
                identifier: patient.identifier, 
                role: patient.role, 
                patient_id: patient.patient_id,
                patient_name: patient.patient_name,
                patient_age: patient.patient_age,
                blood_group: patient.blood_group,
                emergency_contact: patient.emergency_contact,
                street: patient.street,
                area: patient.area,
                district: patient.district,
                state: patient.state,
                profileImage: patient.profileImage
            } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const patientLogin = async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const patient = await Patient.findOne({ identifier });
        if (!patient) return res.status(401).json({ error: 'Invalid credentials' });
        
        const isMatch = await patient.matchPassword(password);
        if (isMatch) {
            const token = jwt.sign({ id: patient._id, identifier: patient.identifier, role: patient.role }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '7d' });
            res.json({ 
                token, 
                user: { 
                    id: patient._id, 
                    identifier: patient.identifier, 
                    role: patient.role,
                    patient_id: patient.patient_id,
                    patient_name: patient.patient_name,
                    patient_age: patient.patient_age,
                    blood_group: patient.blood_group,
                    emergency_contact: patient.emergency_contact,
                    street: patient.street,
                    area: patient.area,
                    district: patient.district,
                    state: patient.state,
                    profileImage: patient.profileImage
                } 
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateFcmToken = async (req, res) => {
    const { fcmToken, role } = req.body;
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        let updatedUser;
        if (role === 'doctor') {
            updatedUser = await Doctor.findByIdAndUpdate(req.user.id, { fcmToken }, { new: true });
        } else if (role === 'patient') {
            updatedUser = await Patient.findByIdAndUpdate(req.user.id, { fcmToken }, { new: true });
        } else {
            updatedUser = await User.findByIdAndUpdate(req.user.id, { fcmToken }, { new: true });
        }
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'FCM token updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const patientUpdate = async (req, res) => {
    const { id } = req.user;
    const { 
        patient_name, 
        patient_age, 
        blood_group, 
        emergency_contact, 
        street, 
        area, 
        district, 
        state,
        profileImage 
    } = req.body;

    console.log("[Backend patientUpdate] Updating patient:", id, "Fields:", {
        patient_name,
        patient_age,
        blood_group,
        emergency_contact,
        street,
        area,
        district,
        state,
        hasProfileImage: !!profileImage
    });

    try {
        const updated = await Patient.findByIdAndUpdate(id, {
            patient_name,
            patient_age,
            blood_group,
            emergency_contact,
            street,
            area,
            district,
            state,
            profileImage
        });

        if (!updated) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({ message: 'Profile updated successfully', user: updated.toJSON() });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Server error during profile update' });
    }
};

module.exports = { login, doctorLogin, patientRegister, patientLogin, updateFcmToken, patientUpdate };
