const Schedule = require('../models/Schedule');
const { createNotification } = require('./notificationController');

const departmentTranslations = {
    "General": "பொது",
    "Cardiology": "கார்டியாலஜி",
    "Pediatrics": "குழந்தைகள் மருத்துவம்",
    "Neurology": "நரம்பியல்",
    "Dermatology": "தோல் மருத்துவம்",
    "Orthopedics": "எலும்பியல்",
    "Gynecology": "மகப்பேறு மருத்துவம்",
    "Dental": "பல் மருத்துவம்",
    "ENT": "காது மூக்கு தொண்டை",
    "Ophthalmology": "கண் மருத்துவம்",
    "Psychiatry": "மனநல மருத்துவம்",
    "Others": "மற்றவை"
};

const translateDepartment = (deptString) => {
    if (!deptString) return deptString;
    return deptString.split(',').map(d => {
        const trimmed = d.trim();
        if (trimmed.includes('/')) return trimmed; // Already translated
        return departmentTranslations[trimmed] ? `${trimmed} / ${departmentTranslations[trimmed]}` : trimmed;
    }).join(', ');
};

const getSchedules = async (req, res) => {
    try {
        const filter = {};
        if (req.query.doctorId) filter.doctorId = req.query.doctorId;
        if (req.query.doctorName) filter.doctorName = req.query.doctorName;
        if (req.query.date) filter.date = req.query.date;

        const schedules = await Schedule.find(filter);
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createSchedule = async (req, res) => {
    try {
        const scheduleData = { ...req.body };
        if (scheduleData.department) {
            scheduleData.department = translateDepartment(scheduleData.department);
        }
        const schedule = await Schedule.create(scheduleData);

        // Determine who created the schedule based on JWT payload
        const createdByDoctor = req.user && req.user.role === 'doctor';

        if (createdByDoctor) {
            // Doctor created the schedule -> Notify Admin only
            await createNotification(
                'admin',
                'admin',
                'New Schedule Created',
                `Dr. ${scheduleData.doctorName || 'A Doctor'} has created a new schedule for ${scheduleData.date}.`,
                'schedule'
            );
        } else {
            // Admin created the schedule -> Notify Doctor only
            if (scheduleData.doctorName) {
                let timeString = scheduleData.time;
                if (Array.isArray(scheduleData.time) && scheduleData.time.length > 0) {
                    const firstSlot = scheduleData.time[0];
                    const lastSlot = scheduleData.time[scheduleData.time.length - 1];
                    const startTime = firstSlot.includes(' to ') ? firstSlot.split(' to ')[0] : firstSlot;
                    const endTime = lastSlot.includes(' to ') ? lastSlot.split(' to ')[1] : lastSlot;
                    timeString = `${startTime} to ${endTime}`;
                }

                await createNotification(
                    'doctor',
                    scheduleData.doctorName,
                    'New Schedule Assigned',
                    `Admin has assigned a new schedule to you for ${scheduleData.date} at ${timeString}.`,
                    'schedule'
                );
            }
        }

        res.status(201).json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateSchedule = async (req, res) => {
    try {
        const scheduleData = { ...req.body };
        if (scheduleData.department) {
            scheduleData.department = translateDepartment(scheduleData.department);
        }
        const schedule = await Schedule.findByIdAndUpdate(req.params.id, scheduleData, { new: true });
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule };
