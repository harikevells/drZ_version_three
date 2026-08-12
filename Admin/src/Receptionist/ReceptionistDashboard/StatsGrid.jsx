import React from 'react';
import { FaUsers, FaUserInjured, FaBed, FaVideo, FaUserMd } from 'react-icons/fa';
import './StatsGrid.css';

const StatsGrid = () => {
  const stats = [
    { id: 1, title: 'Total Patients', value: '128', badge: '+12 Today', badgeClass: 'rd-badge-green', icon: <FaUsers />, iconClass: 'rd-stat-blue' },
    { id: 2, title: 'OP Patients', value: '85', badge: 'Today', badgeClass: 'rd-badge-green', icon: <FaUserInjured />, iconClass: 'rd-stat-green' },
    { id: 3, title: 'IP Patients', value: '32', badge: 'Admitted', badgeClass: 'rd-badge-gray', icon: <FaBed />, iconClass: 'rd-stat-red' },
    { id: 4, title: 'Online Consultations', value: '23', badge: '15 online', badgeClass: 'rd-badge-green', icon: <FaVideo />, iconClass: 'rd-stat-pink' },
    { id: 5, title: 'Doctors Available', value: '18', badge: '3 On Leave', badgeClass: 'rd-badge-green', icon: <FaUserMd />, iconClass: 'rd-stat-green' },
    { id: 6, title: 'Available Beds', value: '12', badge: '42 Occupied', badgeClass: 'rd-badge-gray', icon: <FaBed />, iconClass: 'rd-stat-red' },
  ];

  return (
    <div className="rd-stats-grid">
      {stats.map(stat => (
        <div key={stat.id} className="rd-stat-card">
          <div className={`rd-stat-icon-wrapper ${stat.iconClass}`}>
            {stat.icon}
          </div>
          <div className="rd-stat-info">
            <p>{stat.title}</p>
            <div className="rd-stat-value-row">
              <h3 className="rd-stat-value">{stat.value}</h3>
              <span className={`rd-stat-badge ${stat.badgeClass}`}>{stat.badge}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
