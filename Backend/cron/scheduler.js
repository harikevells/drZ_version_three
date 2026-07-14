const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Schedule = require('../models/Schedule');

const initCronJobs = () => {
    // Schedule a job to run every day at 8:00 AM (server time)
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily schedule check...');
        try {
            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            // Find schedules for today that are approved
            const schedules = await Schedule.find({ date: formattedDate, status: 'Approved' });
            
            if (schedules.length === 0) {
                console.log('No approved schedules for today.');
                return;
            }

            // Configure transporter (using environment variables similar to emailController)
            const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Iterate over today's schedules and send notifications
            for (const schedule of schedules) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    // Note: sending to EMAIL_USER (admin) as default, but in production this could be the doctor's email
                    to: process.env.EMAIL_USER, 
                    subject: `Daily Schedule Reminder: Dr. ${schedule.doctorName}`,
                    html: `
                        <h2>Daily Schedule Reminder</h2>
                        <p><strong>Doctor:</strong> ${schedule.doctorName}</p>
                        <p><strong>Department:</strong> ${schedule.department}</p>
                        <p><strong>Date:</strong> ${schedule.date}</p>
                        <p><strong>Available Slots:</strong> ${schedule.time.join(', ')}</p>
                        <p>Please ensure you are available for your scheduled slots today.</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`Notification sent for Dr. ${schedule.doctorName}'s schedule.`);
            }

        } catch (error) {
            console.error('Error running cron job:', error);
        }
    });

    console.log('Cron jobs initialized successfully.');
};

module.exports = { initCronJobs };
