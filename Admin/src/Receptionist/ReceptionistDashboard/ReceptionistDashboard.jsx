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
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [apptRes, docsRes, patRes, roomsRes, schedRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/emails/all-appointments`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/doctors`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/auth/patients`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/rooms`, config).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/schedules`, config).catch(() => ({ data: [] }))
        ]);
        
        setAppointments(apptRes.data || []);
        setDoctors(docsRes.data || []);
        setPatients(patRes.data || []);
        setRooms(roomsRes.data || []);
        setSchedules(schedRes.data || []);
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
          <StatsGrid 
            appointments={appointments} 
            doctors={doctors} 
            patients={patients} 
            rooms={rooms} 
            schedules={schedules} 
          />
          <AppointmentsTable appointments={appointments} />
        </div>

        {/* Right Sidebar */}
        <SidebarWidget appointments={appointments} />

      </div>
    </div>
  );
};

export default ReceptionistDashboard;
