import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaCheckDouble, FaCircle } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import './DoctorNotifications.css';

const DoctorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const storedData = sessionStorage.getItem('doctorData');
      if (storedData) {
        const user = JSON.parse(storedData);
        if (user.doctorName) {
          const response = await axios.get(`${API_BASE_URL}/notifications/doctor/${encodeURIComponent(user.doctorName)}`);
          setNotifications(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif => (notif._id === id || notif.id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await Promise.all(unreadNotifications.map(n => axios.put(`${API_BASE_URL}/notifications/${n.id || n._id}/read`)));
    } catch (error) {
      console.error('Error marking all as read:', error);
      fetchNotifications();
    }
  };

  const formatMessageDate = (text) => {
    if (!text) return '';
    return text.replace(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/g, '$3/$2/$1');
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 60) return `${diffMins <= 0 ? 1 : diffMins} min ago`;
    if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="doc-notif-container">
        <div className="doc-notif-card">
          <div className="doc-notif-header">
            <div className="doc-notif-title-row">
              <FaBell size={20} color="#6B7AFF" />
              <h3>Your Notifications</h3>
              {unreadCount > 0 && (
                <span className="doc-notif-badge">{unreadCount} New</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button className="doc-mark-all-btn" onClick={handleMarkAllAsRead}>
                <FaCheckDouble /> Mark all as read
              </button>
            )}
          </div>

          <div className="doc-notif-list">
            {loading ? (
              <div className="doc-notif-empty">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="doc-notif-empty">
                <FaBell size={40} color="#CBD5E1" style={{ marginBottom: '10px' }} />
                <p>No notifications found.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id || notif._id} 
                  className={`doc-notif-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => {
                    if (!notif.isRead) handleMarkAsRead(notif.id || notif._id);
                  }}
                >
                  <div className="doc-notif-item-content">
                    <h4 className="doc-notif-item-title">{formatMessageDate(notif.title)}</h4>
                    <p className="doc-notif-item-message">{formatMessageDate(notif.message)}</p>
                    <span className="doc-notif-item-time">{formatTimeAgo(notif.createdAt)}</span>
                  </div>
                  {!notif.isRead && (
                    <div className="doc-notif-unread-dot">
                      <FaCircle size={10} color="#3B82F6" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  );
};

export default DoctorNotifications;
