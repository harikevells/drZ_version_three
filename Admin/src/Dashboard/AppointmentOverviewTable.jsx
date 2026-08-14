import React from 'react';
import './AppointmentOverviewTable.css';

const removeTamil = (text) => {
  if (!text) return '';
  const strText = String(text);
  return strText.split(',').map(item => item.split('/')[0].trim()).join(', ');
};

const AppointmentOverviewTable = ({ appointments }) => {
  const displayList = (appointments && appointments.length > 0)
    ? appointments.slice(0, 5)
    : [
      { id: 1, time: '09:30 AM', patient: 'Ramesh Kumar', doctor: 'Dr. Arun', type: 'OP', mode: 'Offline', status: 'Completed' },
      { id: 2, time: '09:30 AM', patient: 'Ramesh Kumar', doctor: 'Dr. Arun', type: 'OP', mode: 'Offline', status: 'Completed' },
      { id: 3, time: '09:30 AM', patient: 'Ramesh Kumar', doctor: 'Dr. Arun', type: 'OP', mode: 'Offline', status: 'Completed' },
      { id: 4, time: '09:30 AM', patient: 'Ramesh Kumar', doctor: 'Dr. Arun', type: 'OP', mode: 'Offline', status: 'Completed' }
    ];

  return (
    <div className="admin-table-card appointment-table-card">
      <div className="table-card-header">
        <h3>Appointment Overview</h3>
      </div>

      <div className="dashboard-table-wrapper">
        <table className="dashboard-appt-table">
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
            {displayList.map((row, idx) => {
              const timeStr = row.time || row.appointment_time || '09:30 AM';
              const patientStr = row.patient || row.patient_name || 'Ramesh Kumar';
              const docStr = removeTamil(row.doctor || row.doctor_name || 'Dr. Arun');
              const typeStr = row.type || row.appointment_type || 'OP';
              const modeStr = row.mode || row.consultation_mode || 'Offline';
              const statusStr = row.status || 'Completed';

              return (
                <tr key={row.id || idx}>
                  <td className="time-col">{timeStr}</td>
                  <td className="patient-col">{patientStr}</td>
                  <td className="doc-col">{docStr}</td>
                  <td className="type-col">{typeStr}</td>
                  <td className="mode-col">{modeStr}</td>
                  <td className="status-col">
                    <span className={`status-text ${statusStr.toLowerCase()}`}>
                      {statusStr}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentOverviewTable;
