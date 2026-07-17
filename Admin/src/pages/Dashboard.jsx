import React, { useState, useEffect } from 'react';
import { 
  FaUserInjured, FaUserMd, FaCalendarCheck, FaCalendarDay,
  FaTimesCircle, FaClock, FaCheckCircle
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    pieData: [],
    lineData: [],
    summary: { canceled: 0, reschedule: 0, completed: 0 },
    upcoming: []
  });

  const COLORS = ['#c4d2ff', '#a2b2ff', '#7c94ff', '#5b7cff', '#3b5cff'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [apptRes, docsRes] = await Promise.all([
          fetch('http://localhost:5000/api/emails/all-appointments', config),
          fetch('http://localhost:5000/api/doctors', config)
        ]);

        if (apptRes.ok && docsRes.ok) {
          const appointments = await apptRes.json();
          const doctors = await docsRes.json();

          const uniquePatients = new Set(appointments.map(a => a.patient_name?.trim().toLowerCase()));
          
          const today = new Date();
          const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
          const todayCount = appointments.filter(a => a.appointment_date?.replace(/\s+/g, '') === todayStr).length;

          const deptCounts = {};
          appointments.forEach(appt => {
            const doc = doctors.find(d => d.doctorName === appt.doctor_name);
            const dept = doc?.department || 'General';
            // Clean up department name (remove Tamil text after ' / ')
            const cleanDept = dept.split('/')[0].split(',')[0].trim();
            deptCounts[cleanDept] = (deptCounts[cleanDept] || 0) + 1;
          });
          
          let pieData = Object.keys(deptCounts).map(key => ({ name: key || 'General', value: deptCounts[key] }));
          if (pieData.length === 0) pieData = [{ name: 'No Data', value: 1 }];

          const monthCounts = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0 };
          const months = Object.keys(monthCounts);
          appointments.forEach(appt => {
            if (appt.appointment_date) {
              const parts = appt.appointment_date.split('/');
              if (parts.length >= 2) {
                const mIndex = parseInt(parts[1], 10) - 1;
                if (mIndex >= 0 && mIndex < 12) monthCounts[months[mIndex]]++;
              }
            }
          });
          const lineData = months.map(m => ({ name: m, uv: monthCounts[m] }));

          const summary = { canceled: 0, reschedule: 0, completed: 0 };
          appointments.forEach(appt => {
            const stat = (appt.status || '').toLowerCase();
            if (stat === 'cancelled' || stat === 'canceled') summary.canceled++;
            else if (stat === 'reschedule') summary.reschedule++;
            else if (stat === 'completed') summary.completed++;
          });

          const upcoming = appointments
            .filter(a => {
              const stat = (a.status || '').toLowerCase();
              return stat === 'pending' || stat === 'confirm';
            })
            .reverse()
            .map(a => ({
              patient: a.patient_name,
              doctor: a.doctor_name ? a.doctor_name.split(',')[0] : 'N/A',
              date: `${a.appointment_date} ${a.appointment_time || ''}`,
              status: a.status || 'Pending'
            }));

          setData({
            totalPatients: uniquePatients.size,
            totalDoctors: doctors.length,
            totalAppointments: appointments.length,
            todayAppointments: todayCount,
            pieData: pieData.slice(0, 4),
            lineData: lineData.slice(0, 10),
            summary,
            upcoming
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard <span className="header-icon"><MdDashboard /></span></h2> 
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper patient-icon"></div>
            <p className="stat-title">Total Patients</p>
          </div>
          <h3 className="stat-value">{loading ? '...' : data.totalPatients}</h3>
          <p className="stat-change positive">Active Patients</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper doctor-icon"></div>
            <p className="stat-title">Total Doctors</p>
          </div>
          <h3 className="stat-value">{loading ? '...' : data.totalDoctors}</h3>
          <p className="stat-change positive">Registered Doctors</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper total-appt-icon"></div>
            <p className="stat-title">Total Appointment</p>
          </div>
          <h3 className="stat-value">{loading ? '...' : data.totalAppointments}</h3>
          <p className="stat-change positive">Total Bookings</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper today-appt-icon"></div>
            <p className="stat-title">Today's Appointment</p>
          </div>
          <h3 className="stat-value">{loading ? '...' : data.todayAppointments}</h3>
          <a href="/patient" className="stat-link">View</a>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-box pie-chart-box">
          <h3>Department Wise Statistics</h3>
          {loading ? <p style={{textAlign:'center', marginTop: '40px'}}>Loading...</p> : (
            <div className="pie-container">
              <div className="pie-wrapper">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.pieData} innerRadius={0} outerRadius={80} paddingAngle={0} dataKey="value" stroke="none">
                      {data.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pie-legend">
                {data.pieData.map((entry, index) => (
                  <div key={index} className="legend-item">
                    <span className="legend-color" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="chart-box line-chart-box">
          <h3>Monthly Appointment Summary</h3>
          {loading ? <p style={{textAlign:'center', marginTop: '40px'}}>Loading...</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="uv" stroke="#6b7cff" strokeWidth={3} dot={{r: 4, fill: '#6b7cff', strokeWidth: 0}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bottom-section">
        <div className="summary-box">
          <h3>Appointment Summary</h3>
          <div className="summary-list">
            <div className="summary-item">
              <div className="summary-label">
                <div className="summary-icon-wrapper cancel-icon"><FaTimesCircle /></div> Canceled Appointment
              </div>
              <span className="summary-count cancel-count">{loading ? '0' : (data.summary.canceled < 10 ? `0${data.summary.canceled}` : data.summary.canceled)}</span>
            </div>
            <div className="summary-item">
              <div className="summary-label">
                <div className="summary-icon-wrapper reschedule-icon"><FaClock /></div> Reschedule Appointment
              </div>
              <span className="summary-count reschedule-count">{loading ? '0' : (data.summary.reschedule < 10 ? `0${data.summary.reschedule}` : data.summary.reschedule)}</span>
            </div>
            <div className="summary-item">
              <div className="summary-label">
                <div className="summary-icon-wrapper complete-icon"><FaCheckCircle /></div> Completed Appointment
              </div>
              <span className="summary-count complete-count">{loading ? '0' : (data.summary.completed < 10 ? `0${data.summary.completed}` : data.summary.completed)}</span>
            </div>
          </div>
        </div>

        <div className="upcoming-box">
          <h3>Upcoming Appointment</h3>
          <div className="upcoming-table-container">
            <table className="upcoming-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Doctor Name</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{textAlign:'center', padding: '20px'}}>Loading...</td></tr>
                ) : data.upcoming.length > 0 ? (
                  data.upcoming.map((appt, i) => (
                    <tr key={i}>
                      <td className="patient-name">{appt.patient}</td>
                      <td>{appt.doctor}</td>
                      <td>{appt.date}</td>
                      <td><span className="status-badge confirm">{appt.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{textAlign:'center', padding: '20px'}}>No upcoming appointments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
