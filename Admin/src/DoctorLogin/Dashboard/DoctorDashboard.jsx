import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarCheck, FaClock, FaCalendarTimes, FaUserInjured, FaCheck, FaTimes } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todaysAppointments: 0, pendingAppointments: 0, rescheduleAppointments: 0, totalAttended: 0 });
  const [patientRequests, setPatientRequests] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [doctorName, setDoctorName] = useState('');

  const fetchDashboardData = async () => {
    try {
      const storedData = sessionStorage.getItem('doctorData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setDoctorName(user.doctorName);
        
        // We might need to encode the doctor name if it contains spaces
        const response = await axios.get(`${API_BASE_URL}/appointments/dashboard/${encodeURIComponent(user.doctorName)}`);
        
        const data = response.data;
        const pendingCount = (data.patientRequests || []).filter(req => req.status?.toLowerCase() === 'pending').length;
        const rescheduledCount = (data.patientRequests || []).filter(req => req.status?.toLowerCase() === 'rescheduled').length;

        setStats({
          todaysAppointments: data.stats?.todaysAppointments || 0,
          pendingAppointments: pendingCount,
          rescheduleAppointments: rescheduledCount,
          totalAttended: data.stats?.totalAttended || 0
        });
        setPatientRequests(data.patientRequests || []);
        setRecentPatients(data.recentPatients || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API_BASE_URL}/appointments/${id}/status`, { status });
      // In a real app we might want a toast notification here
      fetchDashboardData(); // Refresh list after update
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update appointment status.');
    }
  };

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

  if (loading) {
    return (
      <div className="doc-loading-state">Loading Dashboard...</div>
    );
  }

  return (
    <div className="doc-dashboard-content">
        
        {/* Stats Row */}
        <div className="doc-stats-grid">
          <div className="doc-stat-card bg-blue-light">
            <div className="doc-stat-icon-wrapper bg-blue-main">
              <FaCalendarCheck size={18} color="#fff" />
            </div>
            <h3 className="doc-stat-number">{stats.todaysAppointments < 10 ? `0${stats.todaysAppointments}` : stats.todaysAppointments}</h3>
            <p className="doc-stat-label">Today's<br/>Appointments</p>
          </div>

          <div className="doc-stat-card bg-green-light">
            <div className="doc-stat-icon-wrapper bg-green-main">
              <FaClock size={18} color="#fff" />
            </div>
            <h3 className="doc-stat-number">{stats.pendingAppointments < 10 ? `0${stats.pendingAppointments}` : stats.pendingAppointments}</h3>
            <p className="doc-stat-label">Pending<br/>Appointments</p>
          </div>

          <div className="doc-stat-card bg-blue-light">
            <div className="doc-stat-icon-wrapper bg-blue-main">
              <FaCalendarTimes size={18} color="#fff" />
            </div>
            <h3 className="doc-stat-number">{stats.rescheduleAppointments < 10 ? `0${stats.rescheduleAppointments}` : stats.rescheduleAppointments}</h3>
            <p className="doc-stat-label">Rescheduled<br/>Appointments</p>
          </div>
        </div>

        <div className="doc-dashboard-grid">
          {/* Upcoming Appointments List */}
          <div className="doc-main-panel">
            <div className="doc-panel-header">
              <h3>Upcoming Appointments</h3>
              <button className="doc-view-all-btn">See All</button>
            </div>

            <div className="doc-request-list">
              {patientRequests.length === 0 ? (
                <div className="doc-empty-state">No upcoming appointments.</div>
              ) : (
                patientRequests.slice(0, 4).map((patient) => (
                  <div key={patient.id || patient._id} className="doc-request-card">
                    <div className="doc-request-header">
                      <div className="doc-request-avatar">
                        <FaUserInjured size={24} color="#6B7AFF" />
                      </div>
                      <div className="doc-request-info">
                        <div className="doc-request-name-row">
                          <h4>{patient.patient_name}</h4>
                          <span className={`doc-status-badge ${getStatusBadge(patient.status)}`}>
                            {patient.status}
                          </span>
                        </div>
                        <p className="doc-request-datetime">
                          {patient.appointment_date} • {patient.appointment_time}
                        </p>
                        <p className="doc-request-category">
                          {patient.treatment_category || 'General Consultation'}
                        </p>
                      </div>
                    </div>
                    
                    {patient.status?.toLowerCase() === 'pending' && (
                      <div className="doc-request-actions">
                        <button 
                          className="doc-action-btn doc-btn-approve"
                          onClick={() => handleStatusUpdate(patient.id || patient._id, 'Approved')}
                        >
                          <FaCheck /> Approve
                        </button>
                        <button 
                          className="doc-action-btn doc-btn-reschedule"
                        >
                          <FaClock /> Reschedule
                        </button>
                        <button 
                          className="doc-action-btn doc-btn-cancel"
                          onClick={() => handleStatusUpdate(patient.id || patient._id, 'Cancelled')}
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions & Recent History Side Panel */}
          <div className="doc-side-panel">
            <div className="doc-panel-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="doc-quick-actions-grid">
              <button className="doc-qa-btn">
                <div className="doc-qa-icon bg-blue-qa"><FaCalendarCheck color="#4871F7"/></div>
                <span>Add<br/>Appt</span>
              </button>
              <button className="doc-qa-btn">
                <div className="doc-qa-icon bg-purple-qa"><FaUserInjured color="#8B5CF6"/></div>
                <span>Patient<br/>History</span>
              </button>
              <button className="doc-qa-btn">
                <div className="doc-qa-icon bg-cyan-qa"><FaCalendarTimes color="#0D6EFD"/></div>
                <span>Create<br/>Rx</span>
              </button>
            </div>

            <div className="doc-panel-header" style={{ marginTop: '30px' }}>
              <h3>Recent History</h3>
              <button className="doc-view-all-btn">See All</button>
            </div>
            
            <div className="doc-recent-history-list">
              {recentPatients.length === 0 ? (
                <div className="doc-empty-state">No recent history.</div>
              ) : (
                recentPatients.slice(0, 3).map((item) => (
                  <div key={item.id || item._id} className="doc-history-card">
                    <div className="doc-history-avatar">
                      <FaUserInjured size={18} color="#64748B" />
                    </div>
                    <div className="doc-history-info">
                      <h4>{item.patient_name}</h4>
                      <p>{item.appointment_date} • {item.appointment_time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
  );
};

export default DoctorDashboard;
