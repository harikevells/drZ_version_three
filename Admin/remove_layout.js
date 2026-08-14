const fs = require('fs');
const path = require('path');
const glob = require('glob');

const directory = path.join('e:', 'drZ_version_three', 'Admin', 'src', 'DoctorLogin');

// Helper to update files
function updateFiles() {
    const files = [
        'Dashboard/DoctorDashboard.jsx',
        'Appointments/DoctorAppointments.jsx',
        'Prescriptions/DoctorPrescriptions.jsx',
        'VideoCall/DoctorVideoCall.jsx',
        'Chat/DoctorChat.jsx',
        'Notifications/DoctorNotifications.jsx',
        'MedicalCamp/DoctorMedicalCamp.jsx',
        'Profile/DoctorProfile.jsx'
    ];

    files.forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.existsSync(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            content = content.replace(/import DoctorLayout from '\.\.\/Layout\/DoctorLayout';\n?/g, '');
            content = content.replace(/<DoctorLayout[^>]*>/g, '<>');
            content = content.replace(/<\/DoctorLayout>/g, '</>');
            fs.writeFileSync(fullPath, content, 'utf-8');
            console.log(`Updated ${file}`);
        } else {
            console.log(`Skipped ${file} - not found`);
        }
    });
}

updateFiles();
