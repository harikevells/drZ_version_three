import React, { useMemo } from 'react';
import { FaUsers, FaUserInjured, FaVideo, FaUserMd, FaBed } from 'react-icons/fa';
import './StatsGrid.css';

const StatsGrid = ({ appointments = [], doctors = [], patients = [], rooms = [], schedules = [] }) => {

  const parseAnyDate = (dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    if (!str) return null;
    const ddmmyyyy = str.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
    if (ddmmyyyy) return new Date(ddmmyyyy[3], parseInt(ddmmyyyy[2], 10) - 1, ddmmyyyy[1]);
    const yyyymmdd = str.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})/);
    if (yyyymmdd) return new Date(yyyymmdd[1], parseInt(yyyymmdd[2], 10) - 1, yyyymmdd[3]);
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const matchToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const dObj = parseAnyDate(dateStr);
    if (!dObj) return false;
    return dObj.getDate() === today.getDate() && dObj.getMonth() === today.getMonth() && dObj.getFullYear() === today.getFullYear();
  };

  const stats = useMemo(() => {
    // 1. Total Patients
    const totalPatientsCount = patients.length > 0 ? patients.length : new Set(appointments.map(a => a.patient_name)).size;
    const newPatientsToday = patients.filter(p => matchToday(p.createdAt || p.registered_date || p.dob)).length;

    // 2. OP Patients
    const opPatients = appointments.filter(a => {
      const type = (a.appointment_type || '').toLowerCase();
      const video = (a.video_call || '').toLowerCase();
      return type.includes('op') || type.includes('offline') || (type === '' && video !== 'yes');
    });
    const opToday = opPatients.filter(a => matchToday(a.appointment_date)).length;

    // 3. Online Consultations
    const onlineAppts = appointments.filter(a => {
      const type = (a.appointment_type || '').toLowerCase();
      const video = (a.video_call || '').toLowerCase();
      return type.includes('online') || video === 'yes';
    });
    const onlineToday = onlineAppts.filter(a => matchToday(a.appointment_date)).length;

    // 4. IP Patients & Beds
    let totalBedsCap = 0;
    let occupiedBedsCount = 0;
    if (rooms.length > 0) {
      rooms.forEach(r => {
        const cap = parseInt(r.capacity, 10) || 1;
        const occ = Array.isArray(r.patients) ? r.patients.length : (r.status === 'Occupied' ? cap : 0);
        totalBedsCap += cap;
        occupiedBedsCount += occ;
      });
    }
    const availableBedsCount = Math.max(0, totalBedsCap - occupiedBedsCount);

    // 5. Doctors
    const todaySchedules = schedules.filter(s => matchToday(s.date) && s.status !== 'Rejected');
    const scheduledDocSet = new Set();
    todaySchedules.forEach(s => {
      if (s.doctorId) scheduledDocSet.add(String(s.doctorId));
      else if (s.doctorName) scheduledDocSet.add(String(s.doctorName).trim().toLowerCase());
    });
    
    const totalDocs = doctors.length || 0;
    const availDocs = scheduledDocSet.size > 0 ? scheduledDocSet.size : doctors.filter(d => String(d.activeStatus) === '1' || d.activeStatus === true || d.activeStatus === 'true').length;
    const onLeaveDocs = Math.max(0, totalDocs - availDocs);

    return [
      { id: 1, title: 'Total Patients', value: totalPatientsCount.toString(), badge: `+${newPatientsToday} Today`, badgeClass: 'rd-badge-green', icon: <FaUsers />, iconClass: 'rd-stat-blue' },
      { id: 2, title: 'OP Patients', value: opPatients.length.toString(), badge: `${opToday} Today`, badgeClass: 'rd-badge-green', icon: <FaUserInjured />, iconClass: 'rd-stat-green' },
      { id: 3, title: 'IP Patients', value: occupiedBedsCount.toString(), badge: 'Admitted', badgeClass: 'rd-badge-gray', icon: <FaBed />, iconClass: 'rd-stat-red' },
      { id: 4, title: 'Online Consultations', value: onlineAppts.length.toString(), badge: `${onlineToday} Today`, badgeClass: 'rd-badge-green', icon: <FaVideo />, iconClass: 'rd-stat-pink' },
      { id: 5, title: 'Doctors Available', value: availDocs.toString(), badge: `${onLeaveDocs} On Leave`, badgeClass: onLeaveDocs > 0 ? 'rd-badge-red' : 'rd-badge-green', icon: <FaUserMd />, iconClass: 'rd-stat-green' },
      { id: 6, title: 'Available Beds', value: availableBedsCount.toString(), badge: `${occupiedBedsCount} Occupied`, badgeClass: 'rd-badge-gray', icon: <FaBed />, iconClass: 'rd-stat-red' }
    ];
  }, [appointments, doctors, patients, rooms, schedules]);

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
