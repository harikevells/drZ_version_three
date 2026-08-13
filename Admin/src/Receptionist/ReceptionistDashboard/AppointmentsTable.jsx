import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './AppointmentsTable.css';

const AppointmentsTable = ({ appointments = [] }) => {
  const navigate = useNavigate();

  const recentAppointments = useMemo(() => {
    // Sort by booking_id, id, or _id descending to get the most recently added appointments
    const sorted = [...appointments].sort((a, b) => {
      const getVal = (app) => app.id || app._id || app.booking_id || '';
      const valA = String(getVal(a));
      const valB = String(getVal(b));
      
      // Natural sort in descending order
      return valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    return sorted.slice(0, 4);
  }, [appointments]);

  const formatTimeSlot = (slot) => {
    if (!slot) return 'N/A';
    try {
      const parsedSlot = JSON.parse(slot);
      return parsedSlot.label || slot;
    } catch (e) {
      return slot;
    }
  };

  return (
    <div className="rd-appointments-section">
      <div className="rd-appointments-header">
        <h2>Recent Appointments</h2>
        <button className="rd-btn-filter" onClick={() => navigate('/patient')} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
          View All
        </button>
      </div>
      <div className="rd-table-responsive">
        <table className="rd-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Consultation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentAppointments.length === 0 ? (
               <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No upcoming appointments found.</td></tr>
            ) : (
               recentAppointments.map((app, index) => (
                <tr key={app.booking_id || index}>
                  <td style={{ fontWeight: '600', color: '#4f46e5' }}>{app.booking_id || 'N/A'}</td>
                  <td>{app.patient_name}</td>
                  <td>{app.doctor_name}</td>
                  <td>{app.appointment_date} <br/><span style={{fontSize: '11px', color: '#64748b'}}>{formatTimeSlot(app.appointment_time)}</span></td>
                  <td>{app.appointment_type || 'Offline'}</td>
                  <td>{app.video_call === 'Yes' ? 'Video Call' : 'In-Person'}</td>
                  <td><span style={{ fontWeight: '600', color: app.status === 'Completed' ? '#16a34a' : '#d97706' }}>{app.status || 'Pending'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentsTable;
