import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaUserMd, FaCalendarCheck, FaBell, FaSignOutAlt, FaUserInjured, FaTachometerAlt } from 'react-icons/fa';
import './Layout.css';
import logoImage from '../assets/DoctorlogoApp1.png';
import adminImage from '../assets/adminimage.png';

const Layout = () => {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('loginTimestamp');
    navigate('/login');
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    fetchUnreadCount();

    const handleUpdate = (e) => {
      if (e.detail && typeof e.detail.unreadCount === 'number') {
        setUnreadCount(e.detail.unreadCount);
      } else {
        fetchUnreadCount();
      }
    };

    window.addEventListener('notification-updated', handleUpdate);
    return () => {
      window.removeEventListener('notification-updated', handleUpdate);
    };
  }, [location.pathname]); // Refresh count when navigation changes

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications/admin/admin`);
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ marginBottom: '0px', padding: '10px 20px 10px 20px', display: 'flex', justifyContent: 'center' }}>
          <img src={logoImage} alt="DrZ Logo" style={{ height: '80px' }} />
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaTachometerAlt className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/dr-management" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaUserMd className="nav-icon" />
            <span>DR Management</span>
          </NavLink>
          <NavLink to="/schedule" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaCalendarCheck className="nav-icon" />
            <span>Schedule</span>
          </NavLink>
          <NavLink to="/patient" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaUserInjured className="nav-icon" />
            <span>Appointment</span>
          </NavLink>
          <NavLink to="/medical-camp" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaBell className="nav-icon" />
            <span>Medical Camp</span>
          </NavLink>
          <NavLink to="/medi" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FaBell className="nav-icon" />
            <span>Medicine Management</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-welcome">
            <h2>Welcome,Admin</h2>
            <p>Super admin For DrZ...</p>
          </div>
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="icon-btn" style={{ position: 'relative' }} onClick={() => navigate('/notifications')}>
                <FaBell />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-5px',
                    backgroundColor: '#e74c3c', color: '#fff', fontSize: '10px',
                    borderRadius: '50%', padding: '2px 6px', fontWeight: 'bold'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button className="icon-btn" onClick={() => setIsLogoutModalOpen(true)}>
                <FaSignOutAlt />
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '10px' }}>
              <span style={{ fontWeight: '600', fontSize: '18px', color: '#1f2937' }}>Admin</span>
              <img 
                src={adminImage} 
                alt="Admin Avatar" 
                style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="content-wrapper">
          <Outlet />
        </main>
      </div>

      {isLogoutModalOpen && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            <img src={logoImage} alt="DrZ Logo" style={{ height: '50px', marginBottom: '20px' }} />
            <p>Are you sure you want to logout?</p>
            <div className="logout-modal-actions">
              <button style={{width:'150px', borderRadius:'20px'}} className="cancel-btn" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button style={{width:'150px', borderRadius:'20px'}} className="confirm-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
