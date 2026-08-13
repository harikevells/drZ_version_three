import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaUserMd, FaCalendarCheck, FaBell, FaSignOutAlt, FaUserInjured, FaTachometerAlt, FaChevronDown, FaChevronUp, FaPills, FaListUl, FaClock, FaPrescriptionBottle, FaUsers, FaCreditCard, FaFileInvoiceDollar, FaCalendarAlt, FaBed } from 'react-icons/fa';
import './Layout.css';
import logoImage from '../assets/Dclogo.png';
import adminImage from '../assets/adminimage.png';
import doctorImage from '../assets/doctorimage1.png';
import pharmacyImage from '../assets/Pharmacylogo.webp';
import receptionistImage from '../assets/receptionistlogo.jpg';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning! 🌅';
  if (hour < 17) return 'Good Afternoon! 👋';
  return 'Good Evening! 🌙';
};

const Layout = () => {
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMedicineOpen, setIsMedicineOpen] = useState(false);
  const [isRevenueOpen, setIsRevenueOpen] = useState(false);

  const userRole = sessionStorage.getItem('role') || 'Admin';
  const userName = sessionStorage.getItem('userName') || 'Admin';

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('loginTimestamp');
    navigate('/login');
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const getProfileImage = () => {
    if (userRole === 'Admin') return adminImage;
    if (userRole === 'Pharmacy') return pharmacyImage;
    if (userRole === 'Receptionist') return receptionistImage;
    return adminImage; // default fallback
  };

  useEffect(() => {
    if (userRole === 'Pharmacy' && (location.pathname === '/dashboard' || location.pathname === '/')) {
      navigate('/pharmacy-dashboard');
    } else if (userRole === 'Receptionist' && !['/receptionist-dashboard', '/patient', '/notifications', '/room-management'].includes(location.pathname)) {
      navigate('/receptionist-dashboard');
    }

    if (userRole !== 'Pharmacy' && location.pathname === '/pharmacy-dashboard') {
      navigate('/dashboard');
    }
    if (userRole !== 'Receptionist' && location.pathname === '/receptionist-dashboard') {
      navigate('/dashboard');
    }
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
  }, [location.pathname, userRole]); // Refresh count when navigation changes

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
          {userRole === 'Pharmacy' ? (
            <>
              <NavLink to="/pharmacy-dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaTachometerAlt className="nav-icon" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/medi" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaListUl className="nav-icon" />
                <span>Medicine Create</span>
              </NavLink>
              <NavLink to="/purchase-medicine" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaFileInvoiceDollar className="nav-icon" />
                <span>Medicine Billing</span>
              </NavLink>
              <NavLink to="/billing-medicine" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaFileInvoiceDollar className="nav-icon" />
                <span>Billing Medicine</span>
              </NavLink>

              <div className="support-card">
                <div className="support-card-content">
                  <h4>Need Help?</h4>
                  <p>We're here to help you 24/7</p>
                  <button className="support-btn">Contact Support</button>
                </div>
                <img src={doctorImage} alt="Support" className="support-card-img" />
              </div>
            </>
          ) : userRole === 'Receptionist' ? (
            <>
              <NavLink to="/receptionist-dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaTachometerAlt className="nav-icon" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/patient" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaUserInjured className="nav-icon" />
                <span>Appointment</span>
              </NavLink>
              <NavLink to="/room-management" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaBed className="nav-icon" />
                <span>Admission</span>
              </NavLink>
              
              <div className="support-card">
                <div className="support-card-content">
                  <h4>Need Help?</h4>
                  <p>We're here to help you 24/7</p>
                  <button className="support-btn">Contact Support</button>
                </div>
                <img src={doctorImage} alt="Support" className="support-card-img" />
              </div>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaTachometerAlt className="nav-icon" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/dr-management" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaUserMd className="nav-icon" />
                <span>DR Management</span>
              </NavLink>
              <NavLink to="/schedule" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaCalendarCheck className="nav-icon" />
                <span>Schedule</span>
              </NavLink>
              <NavLink to="/patient" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaUserInjured className="nav-icon" />
                <span>Appointment</span>
              </NavLink>

              <NavLink to="/patient-list" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaUsers className="nav-icon" />
                <span>Patient List</span>
              </NavLink>
              <NavLink to="/medical-camp" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaBell className="nav-icon" />
                <span>Push Message</span>
              </NavLink>

              <NavLink to="/room-management" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <FaBed className="nav-icon" />
                <span>Room Creation</span>
              </NavLink>

              <div
                className={`nav-item ${['/medi', '/medicine-time', '/medicine-intake', '/pharmarcy-creation'].includes(location.pathname) ? 'active' : ''}`}
                onClick={() => setIsMedicineOpen(!isMedicineOpen)}
                style={{ cursor: 'pointer', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FaPills className="nav-icon" />
                  <span>Medicine Management</span>
                </div>
                {isMedicineOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>

              {isMedicineOpen && (
                <div className="sub-nav" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <NavLink to="/medi" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FaListUl className="nav-icon" style={{ fontSize: '14px' }} />
                    <span style={{ fontSize: '13px' }}>Medicine Create</span>
                  </NavLink>
                  <NavLink to="/medicine-time" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FaClock className="nav-icon" style={{ fontSize: '14px' }} />
                    <span style={{ fontSize: '13px' }}>Medicine Time</span>
                  </NavLink>
                  <NavLink to="/medicine-intake" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FaPrescriptionBottle className="nav-icon" style={{ fontSize: '14px' }} />
                    <span style={{ fontSize: '13px' }}>Medicine Intake</span>
                  </NavLink>
                  <NavLink to="/pharmarcy-creation" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FaUsers className="nav-icon" style={{ fontSize: '14px' }} />
                    <span style={{ fontSize: '13px' }}>Clinical Services</span>
                  </NavLink>
                </div>
              )}

              <div
                className={`nav-item ${['/payment', '/revenue'].includes(location.pathname) ? 'active' : ''}`}
                onClick={() => setIsRevenueOpen(!isRevenueOpen)}
                style={{ cursor: 'pointer', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FaCreditCard className="nav-icon" />
                  <span>Revenue Management</span>
                </div>
                {isRevenueOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>

              {isRevenueOpen && (
                <div className="sub-nav" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <NavLink to="/payment" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FaCreditCard className="nav-icon" style={{ fontSize: '14px' }} />
                    <span style={{ fontSize: '13px' }}>Consult Revenue</span>
                  </NavLink>
                  <NavLink to="/revenue" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FaTachometerAlt className="nav-icon" style={{ fontSize: '14px' }} />
                    <span style={{ fontSize: '13px' }}>Doctor's Revenue</span>
                  </NavLink>
                  <NavLink to="/billing-medicine" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FaFileInvoiceDollar className="nav-icon" style={{ fontSize: '14px' }} />
                    <span style={{ fontSize: '13px' }}>Pharmacy Revenue</span>
                  </NavLink>
                </div>
              )}

              <div className="support-card">
                <div className="support-card-content">
                  <h4>Need Help?</h4>
                  <p>We're here to help you 24/7</p>
                  <button className="support-btn">Contact Support</button>
                </div>
                <img src={doctorImage} alt="Support" className="support-card-img" />
              </div>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Top Header */}
        <header className="topbar" style={{ padding: '20px 32px', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left: Greeting & Welcome */}
          <div className="topbar-welcome" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{getGreeting()}</span>
            <h2 style={{ fontSize: '22px', color: '#0f172a', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>
              Welcome back, {userName === 'Admin' ? 'Administrator' : userName}
            </h2>
          </div>

          {/* Right: Date, Actions, Profile */}
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

            {/* Date Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', borderRadius: '12px', }}>
              <FaCalendarAlt color="#1e293b" size={16} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', lineHeight: '1.2' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </span>
              </div>
            </div>

            {/* Icon Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {userRole !== 'Pharmacy' && (
                <button
                  className="icon-btn"
                  style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', color: '#1e293b' }}
                  onClick={() => navigate('/notifications')}
                >
                  <FaBell size={16} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '-2px', right: '-2px',
                      backgroundColor: '#4f46e5', color: '#fff', fontSize: '10px',
                      borderRadius: '50%', padding: '2px 5px', fontWeight: 'bold', border: '2px solid #fff'
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Profile Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px', cursor: 'pointer' }} onClick={() => setIsLogoutModalOpen(true)}>
              <div style={{ position: 'relative' }}>
                <img
                  src={getProfileImage()}
                  alt="Profile"
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f8fafc' }}
                />
                {/* Online Status Dot */}
                <div style={{
                  position: 'absolute', bottom: '2px', right: '0px',
                  width: '12px', height: '12px', backgroundColor: '#10b981',
                  borderRadius: '50%', border: '2px solid #fff'
                }}></div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', lineHeight: '1.2' }}>
                  {userName}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  {userRole}
                </span>
              </div>
              
              <FaChevronDown size={14} color="#64748b" style={{ marginLeft: '4px' }} />
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
              <button style={{ width: '150px', borderRadius: '20px' }} className="cancel-btn" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button style={{ width: '150px', borderRadius: '20px' }} className="confirm-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
