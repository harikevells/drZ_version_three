import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaVideo, FaSearch, FaFilter, FaFilePrescription } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import './DoctorAppointments.css';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [doctorName, setDoctorName] = useState('');
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const storedData = sessionStorage.getItem('doctorData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setDoctorName(user.doctorName);
        
        const response = await axios.get(`${API_BASE_URL}/appointments/all/${encodeURIComponent(user.doctorName)}`);
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update appointment status.');
    }
  };

  // Filter Logic
  const parseDateStr = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      // Assuming DD/MM/YYYY or DD-MM-YYYY
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  const filteredAppointments = appointments.filter(app => {
    if (!app.status) return false;
    const s = app.status.toLowerCase();

    let matchesTab = false;
    if (activeTab === 'Pending') {
      matchesTab = s === 'pending' || s === 'rescheduled';
    } else {
      matchesTab = s === activeTab.toLowerCase();
    }
    if (!matchesTab) return false;

    if (fromDate || toDate) {
      const appDate = parseDateStr(app.appointment_date);
      const start = fromDate ? new Date(fromDate) : null;
      const end = toDate ? new Date(toDate) : null;

      if (appDate) {
        if (start && appDate < start) return false;
        if (end && appDate > end) return false;
      }
    }

    return true;
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'rescheduled': return 'badge-rescheduled';
      case 'cancelled': return 'badge-cancelled';
      case 'completed': return 'badge-completed';
      default: return 'badge-default';
    }
  };

  return (
    <div className="doc-appts-container">
        
        {/* Filters and Tabs */}
        <div className="doc-appts-header">
          <div className="doc-appts-tabs">
            {['Pending', 'Approved', 'Completed', 'Cancelled'].map(tab => (
              <button 
                key={tab}
                className={`doc-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="doc-appts-filters">
            <div className="doc-date-filter">
              <label>From:</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="doc-date-filter">
              <label>To:</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <button className="doc-clear-filter-btn" onClick={() => { setFromDate(''); setToDate(''); }}>
              Clear
            </button>
          </div>
        </div>

        {/* List of Appointments */}
        <div className="doc-appts-list">
          {loading ? (
            <div className="doc-empty-state">Loading Appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="doc-empty-state">No {activeTab.toLowerCase()} appointments found.</div>
          ) : (
            filteredAppointments.map(appt => (
              <div key={appt.id || appt._id} className="doc-appt-card">
                <div className="doc-appt-card-top">
                  <div className="doc-appt-patient-info">
                    <div className="doc-appt-avatar">
                      {appt.patient_name ? appt.patient_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="doc-appt-patient-name">{appt.patient_name}</h4>
                      <p className="doc-appt-booking-id">Booking ID: {appt.booking_id || 'N/A'}</p>
                    </div>
                  </div>
                  <div className={`doc-status-badge ${getStatusBadge(appt.status)}`}>
                    {appt.status}
                  </div>
                </div>

                <div className="doc-appt-card-middle">
                  <div className="doc-appt-detail">
                    <FaCalendarAlt color="#64748B" />
                    <span>{appt.appointment_date}</span>
                  </div>
                  <div className="doc-appt-detail">
                    <FaClock color="#64748B" />
                    <span>{appt.appointment_time}</span>
                  </div>
                  <div className="doc-appt-detail doc-appt-type">
                    <span>{(appt.appointment_type || '').toLowerCase().includes('online') || appt.video_call === 'Yes' ? 'Online Video Call' : 'In-Person Visit'}</span>
                  </div>
                </div>

                <div className="doc-appt-card-bottom">
                  {/* Action Buttons based on status */}
                  {activeTab === 'Pending' && (
                    <div className="doc-appt-actions">
                      <button className="doc-btn doc-btn-approve" onClick={() => handleStatusUpdate(appt.id || appt._id, 'Approved')}>
                        <FaCheckCircle /> Approve
                      </button>
                      <button className="doc-btn doc-btn-reschedule">
                        <FaClock /> Reschedule
                      </button>
                      <button className="doc-btn doc-btn-cancel" onClick={() => handleStatusUpdate(appt.id || appt._id, 'Cancelled')}>
                        <FaTimesCircle /> Cancel
                      </button>
                    </div>
                  )}

                  {activeTab === 'Approved' && (
                    <div className="doc-appt-actions">
                      <button className="doc-btn doc-btn-complete" onClick={() => handleStatusUpdate(appt.id || appt._id, 'Completed')}>
                        <FaCheckCircle /> Complete
                      </button>
                      
                      {((appt.appointment_type || '').toLowerCase().includes('online') || appt.video_call === 'Yes') && (
                        <button className="doc-btn doc-btn-video">
                          <FaVideo /> Join Call
                        </button>
                      )}
                      
                      <button className="doc-btn doc-btn-cancel" onClick={() => handleStatusUpdate(appt.id || appt._id, 'Cancelled')}>
                        <FaTimesCircle /> Cancel
                      </button>
                    </div>
                  )}

                  {activeTab === 'Completed' && (
                    <div className="doc-appt-actions">
                      <button className="doc-btn doc-btn-rx">
                        <FaFilePrescription /> View / Edit Prescription
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
};

export default DoctorAppointments;
