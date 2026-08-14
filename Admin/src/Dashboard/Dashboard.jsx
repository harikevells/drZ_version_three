import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

import StatCards from './StatCards';
import AppointmentOverviewChart from './AppointmentOverviewChart';
import PharmacyStockWidget from './PharmacyStockWidget';
import RevenueOverviewChart from './RevenueOverviewChart';
import AppointmentOverviewTable from './AppointmentOverviewTable';
import BedAvailabilityWidget from './BedAvailabilityWidget';
import './Dashboard.css';

const parseAnyDate = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (!str) return null;

  // DD/MM/YYYY or DD.MM.YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    return new Date(year, month, day);
  }

  // YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    return new Date(year, month, day);
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const matchToday = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const dObj = parseAnyDate(dateStr);
  if (!dObj) return false;
  return (
    dObj.getDate() === today.getDate() &&
    dObj.getMonth() === today.getMonth() &&
    dObj.getFullYear() === today.getFullYear()
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());

  const [rawAppointments, setRawAppointments] = useState([]);
  const [rawBillings, setRawBillings] = useState([]);

  // Dynamic Dashboard States
  const [statData, setStatData] = useState({
    totalDoctors: 0,
    availableDoctors: 0,
    totalPatients: 0,
    newPatients: 0,
    totalPharmacy: 0,
    lowStockCount: 0,
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0
  });

  const [appointmentOverview, setAppointmentOverview] = useState({
    total: 0,
    todaysCount: 0,
    completedCount: 0,
    pendingCount: 0,
    cancelledCount: 0
  });

  const [pharmacyStockData, setPharmacyStockData] = useState({
    lowStock: 0,
    outOfStock: 0,
    expiringSoon: 0
  });

  const [revenueData, setRevenueData] = useState({
    total: 0,
    currency: '₹',
    months: []
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [bedCategories, setBedCategories] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading) {
      updateRevenueForYear(selectedYear, rawAppointments, rawBillings);
    }
  }, [selectedYear]);

  const updateRevenueForYear = (targetYear, appointments, billings) => {
    const tYear = parseInt(targetYear, 10);

    const months = [
      { month: 'Jan', consultation: 0, pharmacy: 0 },
      { month: 'Feb', consultation: 0, pharmacy: 0 },
      { month: 'Mar', consultation: 0, pharmacy: 0 },
      { month: 'Apr', consultation: 0, pharmacy: 0 },
      { month: 'May', consultation: 0, pharmacy: 0 },
      { month: 'Jun', consultation: 0, pharmacy: 0 },
      { month: 'Jul', consultation: 0, pharmacy: 0 },
      { month: 'Aug', consultation: 0, pharmacy: 0 },
      { month: 'Sep', consultation: 0, pharmacy: 0 },
      { month: 'Oct', consultation: 0, pharmacy: 0 },
      { month: 'Nov', consultation: 0, pharmacy: 0 },
      { month: 'Dec', consultation: 0, pharmacy: 0 }
    ];

    appointments.forEach(a => {
      const dObj = parseAnyDate(a.appointment_date || a.date || a.appointmentDate || a.createdAt || a.created_at);
      if (dObj && dObj.getFullYear() === tYear) {
        const mIdx = dObj.getMonth();
        const fee = parseFloat(a.consultation_fee || a.fees || a.consultFee || a.fee || a.amount || 0);
        months[mIdx].consultation += fee;
      }
    });

    billings.forEach(b => {
      const dObj = parseAnyDate(b.billDate || b.date || b.billingDate || b.createdAt || b.created_at);
      if (dObj && dObj.getFullYear() === tYear) {
        const mIdx = dObj.getMonth();
        const totalPayable = parseFloat(b.totalPayable || b.totalAmount || b.grandTotal || 0);
        const consultFee = parseFloat(b.consultFee || 0);
        const medAmt = b.totalMedicineAmount !== undefined && b.totalMedicineAmount !== null
          ? parseFloat(b.totalMedicineAmount) 
          : Math.max(0, totalPayable - consultFee);

        months[mIdx].pharmacy += (medAmt > 0 ? medAmt : totalPayable);
      }
    });

    // 100% Dynamic annual sum
    const totalRev = months.reduce((acc, m) => acc + m.consultation + m.pharmacy, 0);

    setRevenueData({
      total: totalRev,
      currency: '₹',
      months
    });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const [docsRes, patientsRes, medsRes, roomsRes, apptsRes1, apptsRes2, billingsRes, schedulesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/doctors`, authHeader).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/auth/patients`, authHeader).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/medicines`, authHeader).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/rooms`, authHeader).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/emails/all-appointments`, authHeader).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/appointments`, authHeader).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/billings`, authHeader).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/schedules`, authHeader).catch(() => ({ data: [] }))
      ]);

      const doctors = Array.isArray(docsRes.data) ? docsRes.data : [];
      const patients = Array.isArray(patientsRes.data) ? patientsRes.data : [];
      const medicines = Array.isArray(medsRes.data) ? medsRes.data : [];
      const rooms = Array.isArray(roomsRes.data) ? roomsRes.data : [];
      
      const list1 = Array.isArray(apptsRes1.data) ? apptsRes1.data : [];
      const list2 = Array.isArray(apptsRes2.data) ? apptsRes2.data : [];
      
      // Combine and deduplicate appointments
      const apptIdSet = new Set();
      const appointments = [];
      [...list1, ...list2].forEach(item => {
        const idKey = item._id || item.id || (item.patientName + item.appointment_date + item.time);
        if (!apptIdSet.has(idKey)) {
          apptIdSet.add(idKey);
          appointments.push(item);
        }
      });

      const billings = Array.isArray(billingsRes.data) ? billingsRes.data : [];
      const schedules = Array.isArray(schedulesRes.data) ? schedulesRes.data : [];

      setRawAppointments(appointments);
      setRawBillings(billings);

      // 1. Doctors calculation
      const totalDocs = doctors.length;
      const todaySchedules = schedules.filter(s => matchToday(s.date) && s.status !== 'Rejected');
      
      const scheduledDoctorSet = new Set();
      todaySchedules.forEach(s => {
        if (s.doctorId) scheduledDoctorSet.add(String(s.doctorId));
        else if (s.doctorName) scheduledDoctorSet.add(String(s.doctorName).trim().toLowerCase());
      });

      const availDocs = scheduledDoctorSet.size > 0 
        ? scheduledDoctorSet.size 
        : doctors.filter(d => d.activeStatus === true || d.activeStatus === 1 || d.activeStatus === 'true').length;

      // 2. Patients calculation
      const totalPats = patients.length;
      const newPats = patients.filter(p => matchToday(p.createdAt || p.registered_date || p.dob)).length;

      // 3. Pharmacy calculation
      let lowStockMeds = 0;
      let outOfStockMeds = 0;
      let expiringSoonMeds = 0;
      const today = new Date();

      medicines.forEach(m => {
        const stock = parseInt(m.currentStock, 10) || 0;
        const minStock = parseInt(m.minimumStock, 10) || 10;
        const expDate = m.expiryDate ? new Date(m.expiryDate) : null;
        const daysToExp = expDate && !isNaN(expDate.getTime()) ? (expDate - today) / (1000 * 60 * 60 * 24) : 999;

        if (stock === 0) outOfStockMeds++;
        else if (stock <= minStock) lowStockMeds++;

        if (daysToExp >= 0 && daysToExp <= 30) expiringSoonMeds++;
      });

      const totalMeds = medicines.length;

      // 4. Beds & Rooms dynamic calculation
      let totalBedsCap = 0;
      let occupiedBedsCount = 0;

      const typeMap = {
        'General ward': { occupied: 0, total: 0, available: 0, color: '#2563eb', bgIcon: '#e0e7ff', iconColor: '#3b82f6' },
        'ICU': { occupied: 0, total: 0, available: 0, color: '#be185d', bgIcon: '#fce7f3', iconColor: '#ec4899' },
        'Emergency': { occupied: 0, total: 0, available: 0, color: '#ea580c', bgIcon: '#ffedd5', iconColor: '#f97316' },
        'Private Room': { occupied: 0, total: 0, available: 0, color: '#334155', bgIcon: '#e2e8f0', iconColor: '#475569' }
      };

      if (rooms.length > 0) {
        rooms.forEach(r => {
          const cap = parseInt(r.capacity, 10) || 1;
          const occ = Array.isArray(r.patients) ? r.patients.length : (r.status === 'Occupied' ? cap : 0);
          totalBedsCap += cap;
          occupiedBedsCount += occ;

          const rawType = (r.type || '').toLowerCase();
          let catKey = 'Private Room';
          if (rawType.includes('general')) catKey = 'General ward';
          else if (rawType.includes('icu')) catKey = 'ICU';
          else if (rawType.includes('emergency')) catKey = 'Emergency';

          typeMap[catKey].total += cap;
          typeMap[catKey].occupied += occ;
        });

        Object.keys(typeMap).forEach(k => {
          typeMap[k].available = Math.max(0, typeMap[k].total - typeMap[k].occupied);
        });
      }

      const availableBedsCount = Math.max(0, totalBedsCap - occupiedBedsCount);

      // 5. Appointments calculation
      const totalAppts = appointments.length;
      let upcomingAppts = 0;
      let completedAppts = 0;
      let pendingAppts = 0;
      let cancelledAppts = 0;
      let todaysAppts = 0;

      appointments.forEach(a => {
        const status = (a.status || 'Pending').toLowerCase();
        if (status === 'completed' || status === 'done') completedAppts++;
        else if (status === 'cancelled') cancelledAppts++;
        else upcomingAppts++;

        if (status === 'pending') pendingAppts++;

        if (matchToday(a.appointment_date || a.date)) todaysAppts++;
      });

      // Update state strictly with live API counts
      setStatData({
        totalDoctors: totalDocs,
        availableDoctors: availDocs,
        totalPatients: totalPats,
        newPatients: newPats,
        totalPharmacy: totalMeds,
        lowStockCount: lowStockMeds,
        totalBeds: totalBedsCap,
        availableBeds: availableBedsCount,
        occupiedBeds: occupiedBedsCount,
        totalAppointments: totalAppts,
        upcomingAppointments: upcomingAppts,
        completedAppointments: completedAppts
      });

      setAppointmentOverview({
        total: totalAppts,
        todaysCount: todaysAppts,
        completedCount: completedAppts,
        pendingCount: pendingAppts,
        cancelledCount: cancelledAppts
      });

      setPharmacyStockData({
        lowStock: lowStockMeds,
        outOfStock: outOfStockMeds,
        expiringSoon: expiringSoonMeds
      });

      updateRevenueForYear(selectedYear, appointments, billings);

      setRecentAppointments(appointments.slice(0, 5));

      const bedsList = Object.keys(typeMap).map(k => ({
        type: k,
        ...typeMap[k]
      }));
      setBedCategories(bedsList);

    } catch (err) {
      console.error('Error fetching admin dashboard dynamic data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-admin-dashboard">

      {/* 1. Top Stat Cards (5 Cards in 1 Row) */}
      <StatCards stats={statData} />

      {/* 2. Middle Row Widgets (3 Columns: Donut Chart, Pharmacy Stock, Revenue Chart) */}
      <div className="dashboard-grid-middle">
        <AppointmentOverviewChart data={appointmentOverview} />
        <PharmacyStockWidget stockData={pharmacyStockData} />
        <RevenueOverviewChart 
          revenueData={revenueData} 
          onYearChange={(year) => setSelectedYear(year)}
        />
      </div>

      {/* 3. Bottom Row Widgets (2 Columns: Appointment Table & Bed Availability) */}
      <div className="dashboard-grid-bottom">
        <div className="bottom-left-col">
          <AppointmentOverviewTable appointments={recentAppointments} />
        </div>
        <div className="bottom-right-col">
          <BedAvailabilityWidget bedData={bedCategories} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
