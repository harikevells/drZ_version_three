import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './Dashboard.css';
import StatCards from './StatCards';
import DepartmentStats from './DepartmentStats';
import MonthlySummary from './MonthlySummary';
import AppointmentSummary from './AppointmentSummary';
import UpcomingAppointments from './UpcomingAppointments';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const [dashRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/appointments/admin-dashboard`)
        ]);

        setData(dashRes.data);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to fetch dashboard data. Please make sure the backend is deployed or running locally.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (error || !data) {
    return <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>
      {error || 'No data found'}
    </div>;
  }

  return (
    <div className="dashboard-container">
      <StatCards 
        totalPatients={data.totalPatients} 
        totalDoctors={data.totalDoctors} 
        totalAppointments={data.totalAppointments} 
        todaysAppointments={data.todaysAppointments}
      />
      
      <div className="dashboard-middle-row">
        <DepartmentStats data={data.departmentStats} />
        <MonthlySummary data={data.monthlyStats} />
      </div>
      
      <div className="dashboard-bottom-row">
        <AppointmentSummary data={data.appointmentSummary} />
        <UpcomingAppointments data={data.upcoming} />
      </div>
    </div>
  );
};

export default Dashboard;
