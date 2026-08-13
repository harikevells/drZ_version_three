import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEllipsisV, FaBell, FaEnvelope, FaCog, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import receptionistImage from '../../assets/receptionistlogo.jpg';
import bedImage from '../../assets/bed_illustration.png';
import './SidebarWidget.css';

const SidebarWidget = ({ appointments = [] }) => {
  const navigate = useNavigate();
  const userName = sessionStorage.getItem('userName') || 'Receptionist';
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Find days with appointments in current month
  const appointmentDays = useMemo(() => {
    const days = new Set();
    const currentMonthStr = `${currentDate.getMonth() + 1}`.padStart(2, '0');
    const currentYearStr = `${currentDate.getFullYear()}`;
    
    appointments.forEach(app => {
      const dateStr = app.appointment_date;
      if (!dateStr) return;
      
      let day, month, year;
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          day = parseInt(parts[0], 10);
          month = parts[1];
          year = parts[2];
        }
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          day = parseInt(parts[0], 10);
          month = parts[1];
          year = parts[2];
        }
      }
      
      if (year === currentYearStr && month === currentMonthStr) {
        days.add(day);
      }
    });
    return days;
  }, [appointments, currentDate]);

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
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications/admin/admin`);
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  const beds = [
    { id: 1, name: 'General Ward', total: '12 Beds', status: 'Available' },
    { id: 2, name: 'Private Ward', total: '12 Beds', status: 'Available' },
    { id: 3, name: 'Semi-Private Ward', total: '12 Beds', status: 'Available' },
    { id: 4, name: 'ICU', total: '12 Beds', status: 'Available' },
    { id: 5, name: 'Emergency', total: '12 Beds', status: 'Available' },
    { id: 6, name: 'Pediatric Ward', total: '12 Beds', status: 'Available' },
  ];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const todayObj = new Date();
  const isCurrentMonth = todayObj.getMonth() === currentDate.getMonth() && todayObj.getFullYear() === currentDate.getFullYear();

  const renderDays = () => {
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="rd-calendar-day" style={{ visibility: 'hidden' }}>0</div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      let classes = "rd-calendar-day";
      if (isCurrentMonth && todayObj.getDate() === i) {
        classes += " rd-active";
      } else if (appointmentDays.has(i)) {
        classes += " rd-red";
      }
      daysArray.push(<div key={`day-${i}`} className={classes}>{i}</div>);
    }
    return daysArray;
  };

  return (
    <div className="rd-sidebar">
      
      {/* Calendar Widget */}
      <div className="rd-sidebar-card">
        <div className="rd-calendar-header">
          <FaChevronLeft size={14} style={{cursor: 'pointer'}} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} />
          <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <FaChevronRight size={14} style={{cursor: 'pointer'}} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} />
        </div>
        <div className="rd-calendar-grid">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="rd-calendar-day-name">{day}</div>
          ))}
          {renderDays()}
        </div>
      </div>

      {/* Profile Card */}
      <div className="rd-sidebar-card">
        <div className="rd-profile-header">
          <h3>Your Profile</h3>
          <FaEllipsisV size={14} style={{cursor: 'pointer', color: '#6b7280'}} />
        </div>
        <div className="rd-profile-img-container">
          <img 
            src={receptionistImage} 
            alt="Profile" 
            className="rd-profile-img" 
          />
        </div>
        <div className="rd-profile-info">
          <h4>Good Morning {userName}</h4>
          <p>Continue Your Journey And Achieve Your Target</p>
        </div>
        <div className="rd-profile-actions">
          <div className="rd-action-btn" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/notifications')}>
            <FaBell size={14} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                backgroundColor: '#ef4444', color: '#fff', fontSize: '9px',
                borderRadius: '50%', padding: '2px 4px', fontWeight: 'bold'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="rd-action-btn"><FaEnvelope size={14} /></div>
          <div className="rd-action-btn"><FaCog size={14} /></div>
        </div>
      </div>

      {/* Available Beds */}
      <div className="rd-sidebar-card">
        <div className="rd-beds-header">
          <h3>Available Beds</h3>
          <button className="rd-btn-add"><FaPlus size={10} /></button>
        </div>
        <div className="rd-beds-list">
          {beds.map(bed => (
            <div key={bed.id} className="rd-bed-item">
              <div className="rd-bed-info-left">
                <img src={bedImage} alt="Bed" className="rd-bed-img" />
                <div className="rd-bed-details">
                  <h5>{bed.name}</h5>
                  <p>{bed.total}</p>
                </div>
              </div>
              <div className="rd-badge-available">{bed.status}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SidebarWidget;
