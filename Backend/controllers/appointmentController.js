const Appointment = require('../models/Appointment');
const { createNotification } = require('./notificationController');

const getDoctorDashboard = async (req, res) => {
    try {
        const { doctorName } = req.params;
        
        const totalAttended = await Appointment.countDocuments({ doctor_name: doctorName, status: { $in: ['Completed', 'completed'] } });
        const pendingAppointments = await Appointment.countDocuments({ doctor_name: doctorName, status: { $in: ['Pending', 'pending', 'Rescheduled', 'rescheduled'] } });
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const todayDateStr = `${dd}/${mm}/${yyyy}`;

        const todaysAppointments = await Appointment.countDocuments({ 
            doctor_name: doctorName, 
            appointment_date: todayDateStr,
            status: { $in: ['Pending', 'pending', 'Rescheduled', 'rescheduled', 'Approved', 'approved', 'Completed', 'completed'] } 
        }); 

        const patientRequests = await Appointment.find({ doctor_name: doctorName, status: { $in: ['Pending', 'pending', 'Rescheduled', 'rescheduled'] } }).sort({ createdAt: -1 });

        const recentPatients = await Appointment.find({ doctor_name: doctorName, status: { $in: ['Completed', 'completed', 'Approved', 'approved'] } })
            .sort({ updatedAt: -1 })
            .limit(10);

        res.json({
            stats: { todaysAppointments, pendingAppointments, totalAttended },
            patientRequests,
            recentPatients
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, appointment_date, appointment_time } = req.body; 
        
        let updateData = { status };
        if (appointment_date) updateData.appointment_date = appointment_date;
        if (appointment_time) updateData.appointment_time = appointment_time;

        const appointment = await Appointment.findByIdAndUpdate(id, updateData, { new: true });
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
        
        // Notify Admin
        await createNotification(
            'admin',
            'admin',
            `Appointment ${status}`,
            `Appointment for Patient ${appointment.patient_name} was marked as ${status} by Dr. ${appointment.doctor_name}.`,
            'appointment_status'
        );

        // Notify Patient
        if (appointment.login_mobile) {
            await createNotification(
                'patient',
                appointment.login_mobile,
                `Appointment ${status}`,
                `Your appointment with Dr. ${appointment.doctor_name} for ${appointment.appointment_date} at ${appointment.appointment_time} has been marked as ${status}.`,
                'appointment_status'
            );
        }

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllDoctorAppointments = async (req, res) => {
    try {
        const { doctorName } = req.params;
        const appointments = await Appointment.find({ doctor_name: doctorName }).sort({ createdAt: -1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getBookedTimingsByDate = async (req, res) => {
    try {
        const { doctorName, date } = req.params;
        
        // Find all appointments for this doctor on this date that are either pending or approved
        const appointments = await Appointment.find({ 
            doctor_name: doctorName, 
            appointment_date: date,
            status: { $in: ['Pending', 'Approved', 'Rescheduled'] }
        });
        
        const bookedTimes = appointments.map(a => a.appointment_time);
        res.json({ bookedTimes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getDoctorDashboard, updateAppointmentStatus, getAllDoctorAppointments, getBookedTimingsByDate };
