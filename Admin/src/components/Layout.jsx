import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaUserMd, FaCalendarCheck, FaBell, FaSignOutAlt, FaUserInjured } from 'react-icons/fa';
import './Layout.css';
import logoImage from '../assets/logo.png';

const Layout = () => {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    fetchUnreadCount();
  }, [location.pathname]); // Refresh count when navigation changes

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications/admin/admin');
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
        <div className="sidebar-logo" style={{ marginBottom: '5px', padding: '20px 20px 0 20px', display: 'flex', justifyContent: 'center' }}>
          <img src={logoImage} alt="DrZ Logo" style={{ height: '80px' }} />
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
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
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-welcome">
            <h2>Welcome, Johnny.</h2>
            <p>Super admin For DrZ...</p>
          </div>
          <div className="topbar-actions">
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
              <button className="cancel-btn" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button className="confirm-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
