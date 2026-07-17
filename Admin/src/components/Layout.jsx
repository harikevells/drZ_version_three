import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaUserMd, FaCalendarCheck, FaBell, FaSignOutAlt, FaUserInjured, FaUsers, FaPills, FaClock, FaUtensils } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
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
      {/* Top Header */}
      <header className="topbar">
        <div className="topbar-logo">
          <img src={logoImage} alt="DrZ Logo" style={{ height: '40px' }} />
        </div>
        
        <div className="topbar-actions">
          <button className="icon-btn action-btn" onClick={() => navigate('/notifications')}>
            <FaBell />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          <button className="icon-btn action-btn" onClick={() => setIsLogoutModalOpen(true)} title="Logout">
            <FaSignOutAlt />
          </button>
          <div className="admin-profile">
            <span className="admin-name">Admin</span>
            <div className="admin-avatar">
              <img src="https://i.pravatar.cc/150?img=1" alt="admin" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            </div>
          </div>
        </div>
      </header>

      <div className="main-content-wrapper">
        {/* Blue Sidebar */}
        <aside className="blue-sidebar">
          <nav className="sidebar-nav">
            <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <div className="nav-icon"><MdDashboard /></div>
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/push-messages" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <div className="nav-icon"><FaBell /></div>
              <span>Push Messages</span>
            </NavLink>
            <NavLink to="/medicine" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <div className="nav-icon"><FaPills /></div>
              <span>Create Medicine</span>
            </NavLink>
            <NavLink to="/medicine-timing" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <div className="nav-icon"><FaClock /></div>
              <span>Create Timing</span>
            </NavLink>
            <NavLink to="/medicine-intake" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <div className="nav-icon"><FaUtensils /></div>
              <span>Create Intake</span>
            </NavLink>
            <NavLink to="/patient-list" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <div className="nav-icon"><FaUsers /></div>
              <span>Patient List</span>
            </NavLink>
            <NavLink to="/doctors" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <div className="nav-icon"><FaUserMd /></div>
              <span>DR Management</span>
            </NavLink>
            <NavLink to="/schedule" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <div className="nav-icon"><FaCalendarCheck /></div>
              <span>Schedule</span>
            </NavLink>
            <NavLink to="/patient" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <div className="nav-icon"><FaUserInjured /></div>
              <span>Appointment</span>
            </NavLink>
          </nav>
        </aside>

        {/* Page Content */}
        <main className="page-content">
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
