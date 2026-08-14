import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaUsers, FaPills, FaBed, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import './StatCards.css';

const StatCards = ({ stats }) => {
  const navigate = useNavigate();

  const doctorCount = stats?.totalDoctors ?? 48;
  const availableDocs = stats?.availableDoctors ?? 32;

  const patientCount = (stats?.totalPatients ?? 1248).toLocaleString();
  const newPatients = stats?.newPatients ?? 36;

  const pharmacyCount = stats?.totalPharmacy ?? 856;
  const lowStockCount = stats?.lowStockCount ?? 12;

  const totalBeds = stats?.totalBeds ?? 120;
  const availableBeds = stats?.availableBeds ?? 38;
  const occupiedBeds = stats?.occupiedBeds ?? 82;

  const totalAppointments = stats?.totalAppointments ?? 64;
  const upcomingAppointments = stats?.upcomingAppointments ?? 28;
  const completedAppointments = stats?.completedAppointments ?? 36;

  return (
    <div className="admin-stat-cards-row">
      {/* 1. Doctors Card */}
      <div className="admin-stat-card card-doctors">
        <div className="card-top">
          <div className="card-icon-wrapper icon-doctors">
            <FaUserMd />
          </div>
          <div className="card-header-info">
            <span className="card-title">Doctors</span>
            <span className="card-big-val">{doctorCount}</span>
          </div>
        </div>
        <div className="card-substat-single">
          <span className="substat-label">Available Today</span>
          <span className="substat-val purple-text">{availableDocs}</span>
        </div>
        <div className="card-footer" onClick={() => navigate('/dr-management')}>
          <span>View Doctors</span>
          <FaArrowRight className="footer-arrow" />
        </div>
      </div>

      {/* 2. Patients Card */}
      <div className="admin-stat-card card-patients">
        <div className="card-top">
          <div className="card-icon-wrapper icon-patients">
            <FaUsers />
          </div>
          <div className="card-header-info">
            <span className="card-title">Patients</span>
            <span className="card-big-val">{patientCount}</span>
          </div>
        </div>
        <div className="card-substat-single">
          <span className="substat-label">New Today</span>
          <span className="substat-val green-text">{newPatients}</span>
        </div>
        <div className="card-footer" onClick={() => navigate('/patient-list')}>
          <span className="green-link">View Patients</span>
          <FaArrowRight className="footer-arrow green-link" />
        </div>
      </div>

      {/* 3. Pharmacy Card */}
      <div className="admin-stat-card card-pharmacy">
        <div className="card-top">
          <div className="card-icon-wrapper icon-pharmacy">
            <FaPills />
          </div>
          <div className="card-header-info">
            <span className="card-title">Pharmacy</span>
            <span className="card-big-val">{pharmacyCount}</span>
          </div>
        </div>
        <div className="card-substat-single">
          <span className="substat-label">Low Stock</span>
          <span className="substat-val orange-text">{lowStockCount}</span>
        </div>
        <div className="card-footer" onClick={() => navigate('/medi')}>
          <span className="orange-link">View Pharmacy</span>
          <FaArrowRight className="footer-arrow orange-link" />
        </div>
      </div>

      {/* 4. Beds Card */}
      <div className="admin-stat-card card-beds">
        <div className="card-top">
          <div className="card-icon-wrapper icon-beds">
            <FaBed />
          </div>
          <div className="card-header-info">
            <span className="card-title">Beds</span>
            <span className="card-big-val">{totalBeds}</span>
          </div>
        </div>
        <div className="card-substat-split">
          <div className="substat-half">
            <span className="substat-label">Available</span>
            <span className="substat-val green-text">{availableBeds}</span>
          </div>
          <div className="substat-divider"></div>
          <div className="substat-half">
            <span className="substat-label">Occupied</span>
            <span className="substat-val red-text">{occupiedBeds}</span>
          </div>
        </div>
        <div className="card-footer" onClick={() => navigate('/room-management')}>
          <span className="blue-link">View Beds</span>
          <FaArrowRight className="footer-arrow blue-link" />
        </div>
      </div>

      {/* 5. Appointments Card */}
      <div className="admin-stat-card card-appointments">
        <div className="card-top">
          <div className="card-icon-wrapper icon-appointments">
            <FaCalendarAlt />
          </div>
          <div className="card-header-info">
            <span className="card-title">Appointments</span>
            <span className="card-big-val">{totalAppointments}</span>
          </div>
        </div>
        <div className="card-substat-split">
          <div className="substat-half">
            <span className="substat-label">Upcoming</span>
            <span className="substat-val blue-text">{upcomingAppointments}</span>
          </div>
          <div className="substat-divider"></div>
          <div className="substat-half">
            <span className="substat-label">Completed</span>
            <span className="substat-val green-text">{completedAppointments}</span>
          </div>
        </div>
        <div className="card-footer" onClick={() => navigate('/patient')}>
          <span className="purple-link">View Appointments</span>
          <FaArrowRight className="footer-arrow purple-link" />
        </div>
      </div>
    </div>
  );
};

export default StatCards;
