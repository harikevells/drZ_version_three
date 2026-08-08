import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import DoctorManagement from './pages/DoctorManagement';
import Schedule from './pages/Schedule';
import PatientAppointments from './pages/PatientAppointments';
import Notification from './pages/Notification';
import MedicalCamp from './pages/MedicalCamp';
import Dashboard from './Dashboard/Dashboard';
import Medi from './pages/Medi';
import MedicineTime from './pages/MedicineTime';
import MedicineIntake from './pages/MedicineIntake';
import PatientList from './pages/PatientList';
import Payment from './Payment/Payment';
import Revenue from './Payment/Revenue';
import PharmarcyCreattion from './Pharmarcy/PharmarcyCreattion';
import PharmacyDashboard from './Pharmarcy/pharmarcyDashboard/PharmacyDashboard';
import PurchaseMedicine from './Pharmarcy/PurchaseMedicine';
import BillingMedicine from './Pharmarcy/BillingMedicine';

const ProtectedRoute = ({ element }) => {
  const token = sessionStorage.getItem('token');
  const loginTime = sessionStorage.getItem('loginTimestamp');
  if (!token || !loginTime) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('loginTimestamp');
    return <Navigate to="/login" replace />;
  }
  
  const now = new Date().getTime();
  const timeElapsed = now - parseInt(loginTime, 10);
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  if (timeElapsed > twentyFourHours) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('loginTimestamp');
    return <Navigate to="/login" replace />;
  }
  
  return element;
};

const PublicRoute = ({ element }) => {
  const token = sessionStorage.getItem('token');
  const loginTime = sessionStorage.getItem('loginTimestamp');
  const role = sessionStorage.getItem('role');
  if (token && loginTime) {
    const now = new Date().getTime();
    const timeElapsed = now - parseInt(loginTime, 10);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (timeElapsed <= twentyFourHours) {
      return <Navigate to={role === 'Pharmacy' ? "/pharmacy-dashboard" : "/dashboard"} replace />;
    }
  }
  return element;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute element={<Login />} />} />

        <Route path="/" element={<ProtectedRoute element={<Layout />} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pharmacy-dashboard" element={<PharmacyDashboard />} />
          <Route path="dr-management" element={<DoctorManagement />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="patient" element={<PatientAppointments />} />
          <Route path="payment" element={<Payment />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="patient-list" element={<PatientList />} />
          <Route path="notifications" element={<Notification />} />
          <Route path="medical-camp" element={<MedicalCamp />} />
          <Route path="medi" element={<Medi />} />
          <Route path="purchase-medicine" element={<PurchaseMedicine />} />
          <Route path="billing-medicine" element={<BillingMedicine />} />
          <Route path="medicine-time" element={<MedicineTime />} />
          <Route path="medicine-intake" element={<MedicineIntake />} />
          <Route path="pharmarcy-creation" element={<PharmarcyCreattion />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
