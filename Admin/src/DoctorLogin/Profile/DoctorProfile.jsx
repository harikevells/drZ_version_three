import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserMd, FaPhoneAlt, FaTransgender, FaBriefcase, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import { useNavigate } from 'react-router-dom';
import './DoctorProfile.css';

const DoctorProfile = () => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ total: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const storedData = sessionStorage.getItem('doctorData');
      if (storedData) {
        let user = JSON.parse(storedData);
        
        // Fetch full profile details
        try {
          const docRes = await axios.get(`${API_BASE_URL}/doctors`);
          const fullProfile = docRes.data.find(d => d.email === user.email || d.doctorName === user.doctorName);
          if (fullProfile) {
            user = { ...user, ...fullProfile };
          }
        } catch (e) {
          console.error('Error fetching full profile:', e);
        }
        
        setUserData(user);

        // Fetch appointment stats
        if (user.doctorName) {
          try {
            const aptRes = await axios.get(`${API_BASE_URL}/appointments/all/${encodeURIComponent(user.doctorName)}`);
            const appointments = aptRes.data;
            const cancelled = appointments.filter(a => 
              a.status?.toLowerCase() === 'cancelled' || 
              a.status?.toLowerCase() === 'cancel' || 
              a.status?.toLowerCase() === 'canceled'
            ).length;
            
            setStats({
              total: appointments.length,
              cancelled: cancelled
            });
          } catch (e) {
            console.error('Error fetching stats:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error in profile fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to logout?")) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('doctorToken');
      sessionStorage.removeItem('doctorData');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('loginTimestamp');
      navigate('/login');
    }
  };

  const getSpecialization = () => {
    if (!userData?.department) return 'N/A';
    return userData.department.split(',')
      .map(dept => dept.split('/')[0].split('-')[0].trim())
      .filter(Boolean)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="doc-profile-loading">Loading profile...</div>
    );
  }

  return (
    <div className="doc-profile-container">
        
        {/* Header Section */}
        <div className="doc-profile-header-card">
          <div className="doc-profile-avatar-wrap">
            {userData?.image ? (
              <img src={userData.image} alt="Doctor Avatar" className="doc-profile-avatar" />
            ) : (
              <div className="doc-profile-avatar-placeholder">
                <FaUserMd size={50} color="#6B7AFF" />
              </div>
            )}
          </div>
          <div className="doc-profile-header-info">
            <h2>Dr. {userData?.doctorName || 'Doctor'}</h2>
            <p className="doc-profile-spec">{getSpecialization()}</p>
            <p className="doc-profile-email"><FaEnvelope /> {userData?.email || 'N/A'}</p>
          </div>
          <div className="doc-profile-header-actions">
            <button className="doc-profile-logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="doc-profile-stats-row">
          <div className="doc-profile-stat-card">
            <div className="doc-stat-icon blue">
              <FaUserMd size={24} />
            </div>
            <div className="doc-stat-info">
              <h3>{stats.total.toString().padStart(2, '0')}</h3>
              <p>Total Appointments</p>
            </div>
          </div>
          
          <div className="doc-profile-stat-card">
            <div className="doc-stat-icon red">
              <FaUserMd size={24} />
            </div>
            <div className="doc-stat-info">
              <h3>{stats.cancelled.toString().padStart(2, '0')}</h3>
              <p>Cancelled Appointments</p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="doc-profile-details-card">
          <div className="doc-profile-card-header">
            <h3>Profile Details</h3>
          </div>
          <div className="doc-profile-details-grid">
            
            <div className="doc-profile-detail-item">
              <div className="doc-detail-icon">
                <FaUserMd size={20} />
              </div>
              <div className="doc-detail-content">
                <label>Specialization</label>
                <p>{getSpecialization()}</p>
              </div>
            </div>

            <div className="doc-profile-detail-item">
              <div className="doc-detail-icon">
                <FaPhoneAlt size={20} />
              </div>
              <div className="doc-detail-content">
                <label>Mobile Number</label>
                <p>{userData?.mobile || 'N/A'}</p>
              </div>
            </div>

            <div className="doc-profile-detail-item">
              <div className="doc-detail-icon">
                <FaBriefcase size={20} />
              </div>
              <div className="doc-detail-content">
                <label>Experience</label>
                <p>{userData?.experience ? `${userData.experience} Years` : 'N/A'}</p>
              </div>
            </div>

            <div className="doc-profile-detail-item">
              <div className="doc-detail-icon">
                <FaTransgender size={20} />
              </div>
              <div className="doc-detail-content">
                <label>Gender</label>
                <p>{userData?.gender || 'N/A'}</p>
              </div>
            </div>

            <div className="doc-profile-detail-item">
              <div className="doc-detail-icon">
                <FaEnvelope size={20} />
              </div>
              <div className="doc-detail-content">
                <label>Email</label>
                <p>{userData?.email || 'N/A'}</p>
              </div>
            </div>

          </div>
        </div>

    </div>
  );
};

export default DoctorProfile;
