import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaBell, FaCheckDouble } from 'react-icons/fa';
import './Notification.css';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/admin/admin`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) => {
          const itemId = notif.id || notif._id;
          return itemId === id ? { ...notif, isRead: true } : notif;
        })
      );
      
      const updatedNotifs = notifications.map((notif) => {
        const itemId = notif.id || notif._id;
        return itemId === id ? { ...notif, isRead: true } : notif;
      });
      const newCount = updatedNotifs.filter(n => !n.isRead).length;
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: { unreadCount: newCount } }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter((notif) => {
        const isRead = notif.isRead === true || notif.isRead === 1 || notif.isRead === 'true';
        return !isRead;
      });

      await Promise.all(
        unreadNotifs.map((notif) => {
          const itemId = notif.id || notif._id;
          return axios.put(`${API_BASE_URL}/notifications/${itemId}/read`);
        })
      );

      try {
        await axios.put(`${API_BASE_URL}/notifications/readAll/admin/admin`);
      } catch (err) {
        console.warn('Bulk readAll fallback warning:', err);
      }

      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: { unreadCount: 0 } }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (loading) {
    return <div className="notifications-loading">Loading notifications...</div>;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="notifications-title-container">
          <FaBell className="notifications-icon" />
          <h2>Notifications</h2>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </div>
        <button className="mark-all-btn" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
          <FaCheckDouble /> Mark All As Read
        </button>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">No notifications found.</div>
        ) : (
          notifications.map((notif) => {
            const itemId = notif.id || notif._id;
            const isRead = notif.isRead === true || notif.isRead === 1 || notif.isRead === 'true';
            return (
              <div
                key={itemId}
                className={`notification-card ${isRead ? 'read' : 'unread'}`}
                onClick={() => {
                  if (!isRead) handleMarkAsRead(itemId);
                }}
              >
                <div className="notification-content">
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.message}</div>
                  <div className="notification-time">
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
                {!isRead && <div className="unread-indicator"></div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notification;
