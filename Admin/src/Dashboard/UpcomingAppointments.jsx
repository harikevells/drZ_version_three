import React from 'react';
import './UpcomingAppointments.css';

const UpcomingAppointments = ({ data = [] }) => {
  const getStatusClass = (status) => {
    if (!status) return 'pending';
    const s = status.toLowerCase();
    if (s === 'confirm' || s === 'approved' || s === 'completed') return 'confirm';
    if (s === 'pending') return 'pending';
    if (s === 'cancelled' || s === 'canceled') return 'cancelled';
    if (s === 'rescheduled') return 'rescheduled';
    return s;
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    if (parts.length < 2) return dateTimeStr;
    
    const datePart = parts[0];
    const timePart = parts.slice(1).join(' ');
    
    if (timePart.toLowerCase().includes('to') || timePart.includes('-')) return dateTimeStr;

    const match = timePart.match(/(\d+)[:.](\d+)\s*(am|pm)/i);
    if (!match) return dateTimeStr;

    let hrs = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const ampm = match[3].toLowerCase();

    let hrs24 = hrs;
    if (ampm === 'pm' && hrs24 < 12) hrs24 += 12;
    if (ampm === 'am' && hrs24 === 12) hrs24 = 0;

    let eHrs = hrs24 + 1;
    if (eHrs >= 24) eHrs -= 24;

    const eAmpm = eHrs >= 12 ? 'pm' : 'am';
    let dHrs = eHrs % 12;
    if (dHrs === 0) dHrs = 12;

    const eMinsStr = mins < 10 ? '0' + mins : mins;
    const formattedTime = `${timePart} to ${dHrs}.${eMinsStr}${eAmpm}`;

    return `${datePart} ${formattedTime}`;
  };

  return (
    <div className="upcoming-appointments-card">
      <h3 className="section-title">Upcoming Appointment</h3>
      
      <div className="table-responsive">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Doctor Name</th>
              <th>Date & Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.slice(0, 2).map((appt, index) => (
              <tr key={index}>
                <td className="patient-name">{appt.patientName}</td>
                <td className="doctor-name">{appt.doctorName}</td>
                <td className="date-time">{formatDateTime(appt.dateTime)}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(appt.status)}`}>
                    {appt.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No upcoming appointments</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingAppointments;
