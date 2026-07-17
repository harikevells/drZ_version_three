import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import DoctorManagement from './pages/DoctorManagement';
import Schedule from './pages/Schedule';
import PatientAppointments from './pages/PatientAppointments';
import Notification from './pages/Notification';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PushMessages from './pages/PushMessages';
import MedicineManagement from './pages/MedicineManagement';
import CreateMedicineTiming from './pages/CreateMedicineTiming';
import CreateMedicineIntake from './pages/CreateMedicineIntake';

const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  return token ? element : <Navigate to="/login" replace />;
};

const PublicRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : element;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute element={<Login />} />} />
        
        <Route path="/" element={<ProtectedRoute element={<Layout />} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="push-messages" element={<PushMessages />} />
          <Route path="medicine" element={<MedicineManagement />} />
          <Route path="medicine-timing" element={<CreateMedicineTiming />} />
          <Route path="medicine-intake" element={<CreateMedicineIntake />} />
          <Route path="patient-list" element={<PatientList />} />
          <Route path="doctors" element={<DoctorManagement />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="patient" element={<PatientAppointments />} />
          <Route path="notifications" element={<Notification />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
