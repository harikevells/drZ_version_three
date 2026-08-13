import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import './ReceptionistDashboard.css';
import Banner from './Banner';
import StatsGrid from './StatsGrid';
import AppointmentsTable from './AppointmentsTable';
import SidebarWidget from './SidebarWidget';

const ReceptionistDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [apptRes, docsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/emails/all-appointments`, config),
          axios.get(`${API_BASE_URL}/doctors`, config)
        ]);
        
        setAppointments(apptRes.data || []);
        setDoctors(docsRes.data || []);
      } catch (error) {
        console.error("Error fetching Receptionist Dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="rd-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>Loading Dashboard...</div>;
  }

  return (
    <div className="rd-wrapper">
      <div className="rd-container">
        
        {/* Main Content Area */}
        <div className="rd-main">
          <Banner />
          <StatsGrid appointments={appointments} doctors={doctors} />
          <AppointmentsTable appointments={appointments} />
        </div>

        {/* Right Sidebar */}
        <SidebarWidget appointments={appointments} />

      </div>
    </div>
  );
};

export default ReceptionistDashboard;
