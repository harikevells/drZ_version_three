const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { createNotification } = require('./notificationController');

const getDoctorDashboard = async (req, res) => {
    try {
        const { doctorName } = req.params;
        
        const totalAttended = await Appointment.countDocuments({ doctor_name: doctorName, status: { $in: ['Completed', 'completed'] } });
        const pendingAppointments = await Appointment.countDocuments({ doctor_name: doctorName, status: { $in: ['Pending', 'pending'] } });
        const rescheduleAppointments = await Appointment.countDocuments({ doctor_name: doctorName, status: { $in: ['Rescheduled', 'rescheduled'] } });
        
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
            stats: { todaysAppointments, pendingAppointments, rescheduleAppointments, totalAttended },
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
            let patientMessage;
            if (status && status.trim().toLowerCase() === 'rescheduled') {
                patientMessage = `Your appointment with Dr. ${appointment.doctor_name} has been Rescheduled to ${appointment.appointment_date} ${appointment.appointment_time}.`;
            } else {
                patientMessage = `Your appointment with Dr. ${appointment.doctor_name} for ${appointment.appointment_date} has been marked as ${status}.`;
            }
            await createNotification(
                'patient',
                appointment.login_mobile,
                `Appointment ${status}`,
                patientMessage,
                'appointment_status'
            );
        }

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body; 
        
        const appointment = await Appointment.findByIdAndUpdate(id, { payment_status }, { new: true });
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
        
        // Notification for Refunds
        if (payment_status && payment_status.toLowerCase() === 'refunds' && appointment.login_mobile) {
            await createNotification(
                'patient',
                appointment.login_mobile,
                'Payment Refunded',
                `Your amount for Booking ID ${appointment.booking_id || ''} was refunded.`,
                'payment_refund'
            );
        }
        
        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_method } = req.body; 
        
        const appointment = await Appointment.findByIdAndUpdate(id, { payment_method }, { new: true });
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
        
        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateAppointmentPrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { prescription } = req.body;
        
        const appointment = await Appointment.findByIdAndUpdate(id, {
            prescription,
            status: 'Completed'
        }, { new: true });
        
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
        
        // Notify Patient
        if (appointment.login_mobile) {
            await createNotification(
                'patient',
                appointment.login_mobile,
                'Prescription Added',
                `Dr. ${appointment.doctor_name} has provided a prescription for your appointment.`,
                'prescription_added'
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

const exportDoctorAppointments = async (req, res) => {
    try {
        const { doctorName } = req.params;
        const { from, to } = req.query;

        const appointments = await Appointment.find({ doctor_name: doctorName }).sort({ createdAt: -1 });

        let filteredAppointments = appointments;
        
        const parseDateStr = (dateStr) => {
            if (!dateStr) return null;
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d;
            return null;
        };

        if (from || to) {
            const start = parseDateStr(from);
            const end = parseDateStr(to);

            filteredAppointments = appointments.filter(app => {
                const appDate = parseDateStr(app.appointment_date);
                if (appDate) {
                    if (start && appDate < start) return false;
                    if (end && appDate > end) return false;
                }
                return true;
            });
        }

        let csvContent = "Booking ID,Patient Name,Age,Gender,Phone,Category,Appointment Date,Appointment Time,Status,Created At\n";

        const formatTimeSlot = (timeStr) => {
            if (!timeStr) return '';
            const str = String(timeStr).trim();
            if (str.toLowerCase().includes('to') || str.includes('-')) return str;

            const match = str.match(/(\d+)[:.](\d+)\s*(am|pm)/i);
            if (!match) return str;

            let hrs = parseInt(match[1], 10);
            const mins = parseInt(match[2], 10);
            const ampm = match[3].toLowerCase();

            let hrs24 = hrs;
            if (ampm === 'pm' && hrs24 < 12) hrs24 += 12;
            if (ampm === 'am' && hrs24 === 12) hrs24 = 0;

            let eMins = mins;
            let eHrs = hrs24 + 1;
            if (eHrs >= 24) { eHrs -= 24; }

            const eAmpm = eHrs >= 12 ? 'pm' : 'am';
            let dHrs = eHrs % 12;
            if (dHrs === 0) dHrs = 12;

            const eMinsStr = eMins < 10 ? '0' + eMins : eMins;
            return `${str} to ${dHrs}.${eMinsStr}${eAmpm}`;
        };

        filteredAppointments.forEach(app => {
            const bookingId = app.booking_id || app._id || app.id || '';
            const pAge = app.patient_age || app.age || '';
            const pGender = app.patient_gender || app.gender || '';
            const pPhone = app.whatsapp_number || app.login_mobile || '';
            const pTime = formatTimeSlot(app.appointment_time || '');
            const pDate = app.appointment_date || '';
            
            csvContent += `"${bookingId}","${app.patient_name || ''}","${pAge}","${pGender}","${pPhone}","${app.treatment_category || ''}","${pDate}","${pTime}","${app.status || ''}","${app.createdAt ? new Date(app.createdAt).toLocaleString() : ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="appointments_${doctorName}.csv"`);
        res.send(csvContent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAdminDashboard = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const totalDoctors = await Doctor.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const todayDateStr = `${dd}/${mm}/${yyyy}`;
        
        const todaysAppointments = await Appointment.countDocuments({ appointment_date: todayDateStr });
        
        const doctors = await Doctor.find({});
        const deptCounts = {};
        doctors.forEach(doc => {
            const spec = doc.specialization || 'General';
            deptCounts[spec] = (deptCounts[spec] || 0) + 1;
        });
        const departmentStats = Object.keys(deptCounts).map(name => ({
            name,
            count: deptCounts[name]
        })).sort((a, b) => b.count - a.count).slice(0, 3);
        
        const canceled = await Appointment.countDocuments({ status: { $in: ['Cancelled', 'cancelled', 'Canceled', 'canceled'] } });
        const rescheduled = await Appointment.countDocuments({ status: { $in: ['Rescheduled', 'rescheduled'] } });
        const completed = await Appointment.countDocuments({ status: { $in: ['Completed', 'completed'] } });
        const appointmentSummary = { canceled, rescheduled, completed };
        
        const allAppointments = await Appointment.find({});
        const monthlyStats = new Array(12).fill(0);
        allAppointments.forEach(app => {
            if (app.appointment_date) {
                const parts = app.appointment_date.split('/');
                if (parts.length === 3) {
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    if (year === yyyy && month >= 0 && month < 12) {
                        monthlyStats[month]++;
                    }
                }
            }
        });
        
        const upcoming = allAppointments
            .filter(app => {
                if (app.status === 'Confirm' || app.status === 'Pending' || app.status === 'Approved') {
                    if (!app.appointment_date) return false;
                    const parts = app.appointment_date.split('/');
                    if (parts.length === 3) {
                        const appDate = new Date(parts[2], parts[1] - 1, parts[0]);
                        const todayStart = new Date(yyyy, mm - 1, dd);
                        return appDate >= todayStart;
                    }
                }
                return false;
            })
            .sort((a, b) => {
                const partsA = a.appointment_date.split('/');
                const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
                const partsB = b.appointment_date.split('/');
                const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);
                return dateA - dateB;
            })
            .slice(0, 5)
            .map(app => ({
                patientName: app.patient_name || 'Unknown',
                doctorName: app.doctor_name || 'Unknown',
                dateTime: `${app.appointment_date} ${app.appointment_time}`,
                status: app.status
            }));
            
        res.json({
            totalPatients,
            totalDoctors,
            totalAppointments,
            todaysAppointments,
            departmentStats,
            appointmentSummary,
            monthlyStats,
            upcoming
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getDoctorDashboard, updateAppointmentStatus, updatePaymentStatus, updatePaymentMethod, updateAppointmentPrescription, getAllDoctorAppointments, getBookedTimingsByDate, exportDoctorAppointments, getAdminDashboard };
