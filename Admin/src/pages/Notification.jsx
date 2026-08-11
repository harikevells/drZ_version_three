import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  FaBell, FaCheckDouble, FaFilter, FaCalendarPlus, FaCheckCircle,
  FaTimesCircle, FaCalendarCheck, FaSyncAlt, FaUserClock, FaChevronDown
} from 'react-icons/fa';
import './Notification.css';

// ─── Notification type config ────────────────────────────────────────────────
const TYPE_CONFIG = {
  'New Appointment': {
    color: '#8b5cf6', bg: '#f5f3ff', icon: <FaCalendarPlus size={18} color="#7c3aed" />,
    filter: 'New Appointment'
  },
  'Appointment Approved': {
    color: '#2563eb', bg: '#eff6ff', icon: <FaCheckCircle size={18} color="#2563eb" />,
    filter: 'Approve'
  },
  'Appointment Completed': {
    color: '#16a34a', bg: '#f0fdf4', icon: <FaCalendarCheck size={18} color="#16a34a" />,
    filter: 'Complete'
  },
  'Appointment Cancelled': {
    color: '#dc2626', bg: '#fef2f2', icon: <FaTimesCircle size={18} color="#dc2626" />,
    filter: 'Cancel'
  },
  'Appointment Rescheduled': {
    color: '#ea580c', bg: '#fff7ed', icon: <FaSyncAlt size={18} color="#ea580c" />,
    filter: 'Reschedule'
  },
  'Follow-up Scheduled': {
    color: '#d97706', bg: '#fffbeb', icon: <FaUserClock size={18} color="#d97706" />,
    filter: 'Follow up'
  },
  'Prescription Added': {
    color: '#0891b2', bg: '#ecfeff', icon: <FaCheckCircle size={18} color="#0891b2" />,
    filter: 'Complete'
  },
  default: {
    color: '#6b7280', bg: '#f9fafb', icon: <FaBell size={18} color="#6b7280" />,
    filter: 'All Notifications'
  }
};

const getTypeConfig = (title = '') => {
  for (const [key, cfg] of Object.entries(TYPE_CONFIG)) {
    if (key === 'default') continue;
    if (title.toLowerCase().includes(key.toLowerCase())) return cfg;
  }
  return TYPE_CONFIG.default;
};

const FILTERS = ['All Notifications', 'New Appointment', 'Approve', 'Cancel', 'Complete', 'Reschedule', 'Follow up'];

// ─── Time-ago helper ──────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', ',');
};

// ─── Component ────────────────────────────────────────────────────────────────
const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All Notifications');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/admin/admin`);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Close filter dropdown on outside click
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id || n._id) === id ? { ...n, isRead: true } : n)
      );
      const updated = notifications.map(n => (n.id || n._id) === id ? { ...n, isRead: true } : n);
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: { unreadCount: updated.filter(n => !n.isRead).length } }));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => axios.put(`${API_BASE_URL}/notifications/${n.id || n._id}/read`)));
      try { await axios.put(`${API_BASE_URL}/notifications/readAll/admin/admin`); } catch (_) {}
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new CustomEvent('notification-updated', { detail: { unreadCount: 0 } }));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // ─── Filter logic ─────────────────────────────────────────────────────────
  const filtered = activeFilter === 'All Notifications'
    ? notifications
    : notifications.filter(n => {
        const cfg = getTypeConfig(n.title);
        return cfg.filter === activeFilter;
      });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="notif-loading">
        <FaBell size={32} color="#c7d2fe" />
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notif-page">
      {/* ── Header Bar ─────────────────────────────────────── */}
      <div className="notif-header-bar">
        <div className="notif-title-group">
          <FaBell size={22} color="#1e3a8a" />
          <h2 className="notif-title">Notifications</h2>
          <span className="notif-count-badge">{unreadCount}</span>
        </div>

        <div className="notif-header-actions">
          <button
            className="notif-mark-all-btn"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <FaCheckDouble size={14} />
            <span>Mark All As Read</span>
          </button>

          {/* Filter Dropdown */}
          <div className="notif-filter-wrapper" ref={filterRef}>
            <button className="notif-filter-btn" onClick={() => setFilterOpen(v => !v)}>
              <FaFilter size={13} />
              <span>{activeFilter}</span>
              <FaChevronDown size={11} style={{ marginLeft: 4, transition: '0.2s', transform: filterOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {filterOpen && (
              <div className="notif-filter-dropdown">
                {FILTERS.map(f => (
                  <div
                    key={f}
                    className={`notif-filter-option ${activeFilter === f ? 'active' : ''}`}
                    onClick={() => { setActiveFilter(f); setFilterOpen(false); }}
                  >
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Notification List ───────────────────────────────── */}
      <div className="notif-list">
        {filtered.length === 0 ? (
          <div className="notif-empty">
            <FaBell size={40} color="#e0e7ff" />
            <p>No notifications found.</p>
          </div>
        ) : (
          filtered.map(notif => {
            const id = notif.id || notif._id;
            const isRead = notif.isRead === true || notif.isRead === 1 || notif.isRead === 'true';
            const cfg = getTypeConfig(notif.title);

            return (
              <div
                key={id}
                className={`notif-card ${isRead ? 'notif-read' : 'notif-unread'}`}
                style={{ borderLeftColor: cfg.color }}
                onClick={() => { if (!isRead) handleMarkAsRead(id); }}
              >
                {/* Icon badge */}
                <div className="notif-icon-badge" style={{ background: cfg.bg }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="notif-body">
                  <div className="notif-card-title">{notif.title}</div>
                  <div className="notif-card-msg">{notif.message}</div>
                  <div className="notif-card-time">{formatDate(notif.createdAt)}</div>
                </div>

                {/* Time ago & Unread Dot */}
                <div className="notif-right-section">
                  <div className="notif-time-ago">{timeAgo(notif.createdAt)}</div>
                  {!isRead && <div className="notif-unread-dot" style={{ backgroundColor: cfg.color }}></div>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notification;
