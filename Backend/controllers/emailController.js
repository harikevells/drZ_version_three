const nodemailer = require('nodemailer');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { createNotification } = require('./notificationController');

const sendBookingEmail = async (req, res) => {
    try {
        const {
            patient_name,
            patient_age,
            patient_gender,
            whatsapp_number,
            login_mobile,
            treatment_category,
            doctor_name,
            appointment_date,
            appointment_time,
            video_call
        } = req.body;

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
        const translatedCategory = departmentTranslations[treatment_category] 
            ? `${treatment_category} / ${departmentTranslations[treatment_category]}`
            : treatment_category;

        // Fetch or Generate Patient ID
        const patient = await Patient.findOne({ identifier: login_mobile });
        let patient_id = patient ? patient.patient_id : null;

        if (patient && !patient_id) {
            const patientCount = await Patient.countDocuments();
            patient_id = `Pat${String(patientCount + 1).padStart(4, '0')}`;
            await Patient.findByIdAndUpdate(patient.id, { patient_id });
        } else if (!patient) {
            const patientCount = await Patient.countDocuments();
            patient_id = `Pat${String(patientCount + 1).padStart(4, '0')}`;
        }

        // Generate Booking ID
        const appointmentCount = await Appointment.countDocuments();
        const booking_id = `Appmt${String(appointmentCount + 1).padStart(4, '0')}`;

        // Save appointment to MongoDB
        const newAppointment = new Appointment({
            booking_id,
            patient_id,
            patient_name,
            patient_age,
            patient_gender,
            whatsapp_number,
            login_mobile,
            treatment_category: translatedCategory,
            doctor_name,
            appointment_date,
            appointment_time,
            video_call,
            status: 'Pending'
        });
        await newAppointment.save();

        // Notify Admin
        await createNotification(
            'admin',
            'admin',
            'New Appointment Booked',
            `A new appointment has been booked by Patient ${patient_name} with Dr. ${doctor_name} on ${appointment_date} at ${appointment_time}.`,
            'appointment'
        );

        // Notify Doctor
        await createNotification(
            'doctor',
            doctor_name,
            'New Appointment Booked',
            `Patient ${patient_name} has booked a new appointment with you on ${appointment_date} at ${appointment_time}.`,
            'appointment'
        );

        // Notify Patient
        await createNotification(
            'patient',
            login_mobile, // Identifier for patient is their login mobile
            'Appointment Request Submitted',
            `Your appointment request with Dr. ${doctor_name} for ${appointment_date} at ${appointment_time} has been submitted successfully.`,
            'appointment'
        );

        // Configure transporter and send email if credentials are present
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Send email in the background to prevent request blocking or timeouts
            const sendEmailInBackground = async () => {
                try {
                    const transporter = nodemailer.createTransport({
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS
                        }
                    });

                    // Email content
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: process.env.EMAIL_USER, // Sending to the same email or change it to admin email
                        subject: `New Appointment Booking: ${patient_name}`,
                        html: `
                            <h2>New Appointment Request</h2>
                            <p><strong>Patient Name:</strong> ${patient_name}</p>
                            <p><strong>Age:</strong> ${patient_age}</p>
                            <p><strong>Gender:</strong> ${patient_gender}</p>
                            <p><strong>WhatsApp:</strong> ${whatsapp_number || 'N/A'}</p>
                            <p><strong>Login Mobile:</strong> ${login_mobile}</p>
                            <p><strong>Category:</strong> ${translatedCategory}</p>
                            <p><strong>Doctor:</strong> ${doctor_name}</p>
                            <p><strong>Date:</strong> ${appointment_date}</p>
                            <p><strong>Time:</strong> ${appointment_time}</p>
                            <p><strong>Video Call:</strong> ${video_call}</p>
                        `
                    };

                    await transporter.sendMail(mailOptions);
                    console.log("Booking notification email sent successfully in the background");
                } catch (mailErr) {
                    console.error("Failed to send booking email in background:", mailErr.message);
                }
            };

            // Run in background
            sendEmailInBackground();
        } else {
            console.log("Email credentials not configured. Skipping email notifications.");
        }
        
        res.status(200).json({ message: 'Appointment created successfully' });
    } catch (error) {
        console.error('Error in sendBookingEmail controller:', error);
        res.status(500).json({ error: 'Failed to create appointment. ' + error.message });
    }
};

const getBookedTimings = async (req, res) => {
    try {
        const { doctor_name, appointment_date } = req.query;
        if (!appointment_date) {
            return res.status(400).json({ message: "Date is required" });
        }
        
        const filter = { appointment_date };
        if (doctor_name) {
            filter.doctor_name = doctor_name;
        }
        
        const appointments = await Appointment.find(filter);
        // Return array of objects { doctor_name, booked_timings: [] } or just the raw appointments
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching booked timings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ createdAt: -1 }); // Sorting by newest first if createdAt exists, else default sort
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching all appointments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getPatientAppointments = async (req, res) => {
    try {
        const { mobile } = req.params;
        if (!mobile) return res.status(400).json({ message: "Mobile number is required" });
        
        const appointments = await Appointment.find({ login_mobile: mobile }).sort({ updatedAt: -1 });
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { sendBookingEmail, getBookedTimings, getAllAppointments, getPatientAppointments };
