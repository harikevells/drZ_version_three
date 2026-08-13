import React, { useMemo } from 'react';
import { FaUsers, FaUserInjured, FaVideo, FaUserMd, FaBed } from 'react-icons/fa';
import './StatsGrid.css';

const StatsGrid = ({ appointments = [], doctors = [] }) => {

  const stats = useMemo(() => {
    // 1. Total Unique Patients
    const uniquePatients = new Set(appointments.map(app => app.login_mobile || app.patient_name));
    
    // 2. Today's Date String format (try to match typical formats)
    const todayObj = new Date();
    
    const todayStr = todayObj.toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY
    const todayStrUS = todayObj.toLocaleDateString('en-US'); // MM/DD/YYYY

    let todaysApptsCount = 0;
    
    const opPatients = appointments.filter(app => {
      if (app.appointment_date === todayStr || app.appointment_date === todayStrUS) todaysApptsCount++;
      return app.appointment_type === 'Offline' || !app.appointment_type;
    }).length;

    const onlineConsultations = appointments.filter(app => app.appointment_type === 'Online').length;
    
    const doctorsCount = doctors.length;

    return [
      { id: 1, title: 'Total Patients', value: uniquePatients.size.toString() || '0', badge: '+12 Today', badgeClass: 'rd-badge-green', icon: <FaUsers />, iconClass: 'rd-stat-blue' },
      { id: 2, title: 'OP Patients', value: opPatients.toString() || '0', badge: 'Today', badgeClass: 'rd-badge-green', icon: <FaUserInjured />, iconClass: 'rd-stat-green' },
      { id: 3, title: 'IP Patients', value: '0', badge: 'Admitted', badgeClass: 'rd-badge-gray', icon: <FaBed />, iconClass: 'rd-stat-red' },
      { id: 4, title: 'Online Consultations', value: onlineConsultations.toString() || '0', badge: '15 online', badgeClass: 'rd-badge-green', icon: <FaVideo />, iconClass: 'rd-stat-pink' },
      { id: 5, title: 'Doctors Available', value: doctorsCount.toString() || '0', badge: '3 On Leave', badgeClass: 'rd-badge-green', icon: <FaUserMd />, iconClass: 'rd-stat-green' },
      { id: 6, title: 'Available Beds', value: '0', badge: '42 Occupied', badgeClass: 'rd-badge-gray', icon: <FaBed />, iconClass: 'rd-stat-red' }
    ];
  }, [appointments, doctors]);

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
