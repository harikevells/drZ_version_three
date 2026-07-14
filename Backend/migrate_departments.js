const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('./models/Doctor');
const Schedule = require('./models/Schedule');

dotenv.config();

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

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/drz');
        console.log('MongoDB Connected for Migration');

        // Migrate Doctors
        const doctors = await Doctor.find({});
        let doctorsUpdated = 0;
        for (let doctor of doctors) {
            if (doctor.department) {
                const translated = translateDepartment(doctor.department);
                if (translated !== doctor.department) {
                    doctor.department = translated;
                    await doctor.save();
                    doctorsUpdated++;
                }
            }
        }
        console.log(`Updated ${doctorsUpdated} Doctors in the database.`);

        // Migrate Schedules
        const schedules = await Schedule.find({});
        let schedulesUpdated = 0;
        for (let schedule of schedules) {
            if (schedule.department) {
                const translated = translateDepartment(schedule.department);
                if (translated !== schedule.department) {
                    schedule.department = translated;
                    await schedule.save();
                    schedulesUpdated++;
                }
            }
        }
        console.log(`Updated ${schedulesUpdated} Schedules in the database.`);

        console.log('Migration Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrate();
