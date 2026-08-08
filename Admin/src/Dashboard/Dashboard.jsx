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
  const [pharmacyStats, setPharmacyStats] = useState({
    todaysSales: 0,
    totalSales: 0,
    outOfStock: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const [dashRes, billingsRes, medsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/appointments/admin-dashboard`),
          axios.get(`${API_BASE_URL}/billings`, authHeader).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/medicines`, authHeader).catch(() => ({ data: [] }))
        ]);

        setData(dashRes.data);

        // Compute billing stats
        const billings = Array.isArray(billingsRes.data) ? billingsRes.data : [];
        const todayISO = new Date().toISOString().slice(0, 10);
        let todaysSales = 0;
        let totalSales = 0;
        billings.forEach((bill) => {
          const payable = parseFloat(bill.totalPayable || 0);
          totalSales += payable; // all-time total
          const billDateStr = String(bill.billDate || '');
          const billDateObj = billDateStr ? new Date(billDateStr) : null;
          const billDateISO = billDateObj && !isNaN(billDateObj) ? billDateObj.toISOString().slice(0, 10) : '';
          if (billDateISO === todayISO || billDateStr.startsWith(todayISO)) {
            todaysSales += payable;
          }
        });

        // Compute out of stock medicines
        const medicines = Array.isArray(medsRes.data) ? medsRes.data : [];
        const outOfStock = medicines.filter(m => (parseInt(m.currentStock, 10) || 0) === 0).length;

        setPharmacyStats({
          todaysSales: Math.round(todaysSales),
          totalSales: Math.round(totalSales),
          outOfStock
        });

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
        todaysSales={pharmacyStats.todaysSales}
        totalSales={pharmacyStats.totalSales}
        outOfStock={pharmacyStats.outOfStock}
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
