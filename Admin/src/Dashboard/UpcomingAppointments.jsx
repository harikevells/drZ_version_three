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
            {data.length > 0 ? data.map((appt, index) => (
              <tr key={index}>
                <td className="patient-name">{appt.patientName}</td>
                <td className="doctor-name">{appt.doctorName}</td>
                <td className="date-time">{appt.dateTime}</td>
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
