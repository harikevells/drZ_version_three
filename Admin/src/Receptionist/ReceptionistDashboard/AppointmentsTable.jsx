import React from 'react';
import { FaFilter } from 'react-icons/fa';
import './AppointmentsTable.css';

const AppointmentsTable = () => {
  const appointments = [
    { id: 1, time: '09:30 AM', patient: 'Ramesh Kumar', doctor: 'Dr. Arun', type: 'OP', consultation: 'Offline', status: 'Completed' },
    { id: 2, time: '09:30 AM', patient: 'Ramesh Kumar', doctor: 'Dr. Arun', type: 'OP', consultation: 'Offline', status: 'Completed' },
    { id: 3, time: '09:30 AM', patient: 'Ramesh Kumar', doctor: 'Dr. Arun', type: 'OP', consultation: 'Offline', status: 'Completed' },
    { id: 4, time: '09:30 AM', patient: 'Ramesh Kumar', doctor: 'Dr. Arun', type: 'OP', consultation: 'Offline', status: 'Completed' },
  ];

  return (
    <div className="rd-appointments-section">
      <div className="rd-appointments-header">
        <h2>Appointments</h2>
        <button className="rd-btn-filter">
          <FaFilter size={12} /> Filters
        </button>
      </div>
      <div className="rd-table-responsive">
        <table className="rd-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Type</th>
              <th>Consultation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(app => (
              <tr key={app.id}>
                <td>{app.time}</td>
                <td>{app.patient}</td>
                <td>{app.doctor}</td>
                <td>{app.type}</td>
                <td>{app.consultation}</td>
                <td>{app.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentsTable;
