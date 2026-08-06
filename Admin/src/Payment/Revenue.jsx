import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { FaMoneyBillAlt, FaCalendarDay, FaCalendarAlt, FaCalendarCheck, FaFilter, FaRedo } from 'react-icons/fa';
import './Rev.css';
import maleDoctorImg from '../assets/doctorimage.webp';
import femaleDoctorImg from '../assets/Femaledoctorimage.jpeg';
const Revenue = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });
    const [selectedDept, setSelectedDept] = useState('All Departments');
    const [selectedDoctor, setSelectedDoctor] = useState('All Doctors');

    // Dynamic Dates
    const [yearStr, monthStr, dayStr] = selectedDate.split('-');
    const filterDate = new Date(yearStr, monthStr - 1, dayStr);
    
    const todayDateStr = filterDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const currentMonthStr = filterDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    const currentYearStr = filterDate.getFullYear().toString();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [apptRes, docsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/emails/all-appointments`, config),
                fetch(`${API_BASE_URL}/doctors`, config)
            ]);

            if (apptRes.ok && docsRes.ok) {
                const apptData = await apptRes.json();
                const docsData = await docsRes.json();
                setAppointments(Array.isArray(apptData) ? apptData : []);
                setDoctors(Array.isArray(docsData) ? docsData : []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const parseApptDate = (dateStr) => {
        if (!dateStr) return null;
        const str = String(dateStr).replace(/\s+/g, '');

        // Check for DD/MM/YYYY
        const parts = str.split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }

        // Check for YYYY-MM-DD
        const isoParts = str.split('-');
        if (isoParts.length === 3) {
            return new Date(str);
        }

        return null;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const removeTamil = (text) => {
        if (!text) return '';
        const strText = String(text);
        return strText.split(',').map(item => item.split('/')[0].trim()).join(', ');
    };

    // Calculations
    const validAppointments = appointments.filter(a => (a.status || '').toLowerCase() !== 'cancelled');

    let totalRevenue = 0;
    let todaysRevenue = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
    let totalRefunds = 0;

    validAppointments.forEach(appt => {
        let fee = 0;
        if ((appt.payment_status || '').toLowerCase() === 'paid') {
            fee = Number(appt.consultation_fee) || 0;
        }
        if ((appt.payment_status || '').toLowerCase() === 'refunds') {
            totalRefunds += (Number(appt.consultation_fee) || 0);
        }

        totalRevenue += fee;

        const d = parseApptDate(appt.appointment_date);
        if (d) {
            if (d.getDate() === filterDate.getDate() && d.getMonth() === filterDate.getMonth() && d.getFullYear() === filterDate.getFullYear()) {
                todaysRevenue += fee;
            }
            if (d.getMonth() === filterDate.getMonth() && d.getFullYear() === filterDate.getFullYear()) {
                monthlyRevenue += fee;
            }
            if (d.getFullYear() === filterDate.getFullYear()) {
                yearlyRevenue += fee;
            }
        }
    });

    // Filters application
    const filteredAppointments = validAppointments.filter(appt => {
        let docMatch = true;
        let deptMatch = true;

        if (selectedDoctor !== 'All Doctors') {
            docMatch = removeTamil(appt.doctor_name) === selectedDoctor;
        }
        if (selectedDept !== 'All Departments') {
            const doc = doctors.find(d => removeTamil(d.doctorName) === removeTamil(appt.doctor_name));
            const docDept = doc ? removeTamil(doc.department) : 'Unknown';
            deptMatch = docDept.split(',').map(s => s.trim()).includes(selectedDept);
        }

        return docMatch && deptMatch;
    });

    // Doctor Wise Aggregation
    const docStats = {};

    doctors.forEach(doc => {
        const docName = removeTamil(doc.doctorName);
        const docDept = removeTamil(doc.department);

        if (selectedDoctor !== 'All Doctors' && docName !== selectedDoctor) return;
        if (selectedDept !== 'All Departments' && !docDept.split(',').map(s => s.trim()).includes(selectedDept)) return;

        if (!docStats[docName]) {
            docStats[docName] = {
                name: docName,
                specialization: docDept || 'Unknown',
                experience: doc.experience || '-',
                gender: doc.gender || 'Male',
                image: doc?.photo || null,
                appointments: 0,
                revenue: 0
            };
        }
    });

    filteredAppointments.forEach(appt => {
        const docName = removeTamil(appt.doctor_name);
        if (!docStats[docName]) {
            const doc = doctors.find(d => removeTamil(d.doctorName) === docName);
            const docDept = doc ? removeTamil(doc.department) : 'Unknown';

            if (selectedDoctor !== 'All Doctors' && docName !== selectedDoctor) return;
            if (selectedDept !== 'All Departments' && !docDept.split(',').map(s => s.trim()).includes(selectedDept)) return;

            docStats[docName] = {
                name: docName,
                specialization: docDept,
                experience: doc ? (doc.experience || '-') : '-',
                gender: doc ? (doc.gender || 'Male') : 'Male',
                image: doc?.photo || null,
                appointments: 0,
                revenue: 0
            };
        }
        if (docStats[docName]) {
            docStats[docName].appointments += 1;
            if ((appt.payment_status || '').toLowerCase() === 'paid') {
                docStats[docName].revenue += Number(appt.consultation_fee) || 0;
            }
        }
    });

    const doctorList = Object.values(docStats).sort((a, b) => b.revenue - a.revenue);

    // Revenue Summary
    const totalTx = filteredAppointments.filter(a => Number(a.consultation_fee) > 0).length;
    const paidAppts = filteredAppointments.filter(a => (a.payment_status || '').toLowerCase() === 'paid').length;

    let netRev = 0;
    let refunds = 0;
    filteredAppointments.forEach(a => {
        const fee = Number(a.consultation_fee) || 0;
        const status = (a.payment_status || '').toLowerCase();
        if (status === 'refunds') {
            refunds += fee;
        } else if (status === 'paid') {
            netRev += fee;
        }
    });

    const avgBill = paidAppts > 0 ? netRev / paidAppts : 0;

    // Payment Methods
    const methodStats = {
        Cash: 0,
        UPI: 0,
        Card: 0,
        Insurance: 0
    };

    filteredAppointments.forEach(a => {
        const status = (a.payment_status || '').toLowerCase();
        if (status === 'paid') {
            const fee = Number(a.consultation_fee) || 0;
            const m = (a.payment_method || '').toLowerCase();
            if (m === 'cash') methodStats.Cash += fee;
            else if (m === 'card') methodStats.Card += fee;
            else if (m === 'insurance') methodStats.Insurance += fee;
            else if (m === 'razorpay' || m === 'online' || m === 'upi') methodStats.UPI += fee;
            else methodStats.Cash += fee; // Default to cash if unknown
        }
    });

    const allDeptsList = [];
    doctors.forEach(d => {
        const dptStr = removeTamil(d.department);
        if (dptStr) {
            dptStr.split(',').forEach(dept => allDeptsList.push(dept.trim()));
        }
    });
    const uniqueDepts = ['All Departments', ...new Set(allDeptsList.filter(Boolean))];
    const uniqueDoctors = ['All Doctors', ...new Set(doctors.map(d => removeTamil(d.doctorName)).filter(Boolean))];

    return (
        <div className="revenue-dashboard">
            {/* Header Section */}
            <div className="rev-header">
                <div className="rev-title-section">
                    <div className="rev-icon-box">
                        <FaMoneyBillAlt size={24} color="#fff" />
                    </div>
                    <div>
                        <h2>Revenue</h2>
                        <p>Track income and doctor earnings</p>
                    </div>
                </div>
                <div className="rev-actions">
                    <input
                        type="date"
                        className="date-picker-input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ paddingRight: '10px' }}
                    />
                    <button className="filter-btn-outline"><FaFilter /> Filter</button>
                </div>
            </div>

            {/* Top Summary Cards */}
            <div className="rev-summary-cards">
                <div className="rev-card">
                    <div className="card-icon c-purple"><FaMoneyBillAlt /></div>
                    <div className="card-content">
                        <p className="card-label">Total Revenue</p>
                        <h3 className="card-value">{formatCurrency(totalRevenue)}</h3>
                        <p className="card-date-label">All Time</p>
                    </div>
                </div>
                <div className="rev-card">
                    <div className="card-icon c-green"><FaCalendarDay /></div>
                    <div className="card-content">
                        <p className="card-label">Today's Revenue</p>
                        <h3 className="card-value">{formatCurrency(todaysRevenue)}</h3>
                        <p className="card-date-label c-text-green">{todayDateStr}</p>
                    </div>
                </div>
                <div className="rev-card">
                    <div className="card-icon c-orange"><FaCalendarAlt /></div>
                    <div className="card-content">
                        <p className="card-label">Monthly Revenue</p>
                        <h3 className="card-value">{formatCurrency(monthlyRevenue)}</h3>
                        <p className="card-date-label c-text-orange">{currentMonthStr}</p>
                    </div>
                </div>
                <div className="rev-card">
                    <div className="card-icon c-blue"><FaCalendarCheck /></div>
                    <div className="card-content">
                        <p className="card-label">Yearly Revenue</p>
                        <h3 className="card-value">{formatCurrency(yearlyRevenue)}</h3>
                        <p className="card-date-label c-text-blue">{currentYearStr}</p>
                    </div>
                </div>
                <div className="rev-card">
                    <div className="card-icon c-red"><FaRedo /></div>
                    <div className="card-content">
                        <p className="card-label">Refunds</p>
                        <h3 className="card-value">{formatCurrency(totalRefunds)}</h3>
                        <p className="card-date-label c-text-red">All Time</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="rev-filters">
                <div className="filter-group">
                    <label>Department</label>
                    <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                        {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Doctor</label>
                    <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
                        {uniqueDoctors.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="filter-actions">
                    <button className="reset-btn" onClick={() => { setSelectedDept('All Departments'); setSelectedDoctor('All Doctors'); }}>
                        Reset
                    </button>
                    <button className="apply-btn">Apply Filter</button>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="rev-main-grid">
                <div className="rev-left-col">
                    {/* Doctor Wise Revenue */}
                    <div style={{ height: '100%', marginBottom: '0px' }} className="rev-panel">
                        <h3 className="panel-title">Doctor Wise Revenue</h3>
                        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="rev-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Doctor Name</th>
                                        <th>Specialization</th>
                                        <th>Experience</th>
                                        <th>Appointments</th>
                                        <th>Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctorList.map((doc, idx) => {
                                        const specs = doc.specialization.split(',').map(s => s.trim()).filter(Boolean);
                                        const visibleSpecs = specs.slice(0, 1);
                                        const hiddenSpecs = specs.slice(1);
                                        const maleAvatar = maleDoctorImg;
                                        const femaleAvatar = femaleDoctorImg;
                                        const isFemale = String(doc.gender).toLowerCase() === 'female';
                                        const avatarSrc = doc.image ? doc.image : (isFemale ? femaleAvatar : maleAvatar);
                                        return (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td className="doc-name-cell">
                                                    <img src={avatarSrc} alt={doc.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <span style={{ textAlign: 'left', minWidth: '120px' }}>{doc.name}</span>
                                                </td>
                                                <td>
                                                    <div className="dept-cell">
                                                        {visibleSpecs.join(', ')}
                                                        {hiddenSpecs.length > 0 && (
                                                            <div className="tooltip-container">
                                                                <span className="dept-badge">+{hiddenSpecs.length}</span>
                                                                <div className="tooltip-text">{hiddenSpecs.join(', ')}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {doc.experience !== '-' && doc.experience
                                                        ? (String(doc.experience).toLowerCase().includes('yr') ? doc.experience : `${doc.experience} Yrs`)
                                                        : '-'}
                                                </td>
                                                <td>{doc.appointments}</td>
                                                <td className="c-text-green fw-bold">{formatCurrency(doc.revenue)}</td>
                                            </tr>
                                        );
                                    })}
                                    {doctorList.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center' }}>No records found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                <div className="rev-right-col">
                    {/* Revenue Summary */}
                    <div className="rev-panel summary-panel">
                        <h3 className="panel-title">Revenue Summary</h3>
                        <div className="summary-list">
                            <div className="summary-item">
                                <span className="summary-label"><FaMoneyBillAlt className="summary-icon" /> Total Transactions</span>
                                <span className="summary-value">{totalTx.toLocaleString()}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label"><FaCalendarCheck className="summary-icon" /> Paid Appointments</span>
                                <span className="summary-value">{paidAppts.toLocaleString()}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label"><FaRedo className="summary-icon" /> Average Bill Value</span>
                                <span className="summary-value">{formatCurrency(avgBill)}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label"><FaCalendarAlt className="summary-icon" /> Refunds</span>
                                <span className="summary-value">{formatCurrency(refunds)}</span>
                            </div>
                        </div>
                        <div className="summary-total">
                            <span>Net Revenue</span>
                            <span className="net-rev-value">{formatCurrency(netRev)}</span>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div style={{ marginBottom: '0px' }} className="rev-panel method-panel">
                        <h3 className="panel-title">Payment Methods</h3>
                        <div className="method-list">
                            <div className="method-item">
                                <span className="method-label"><div className="m-dot cash-dot"></div> Cash</span>
                                <span className="method-value fw-bold">{formatCurrency(methodStats.Cash)}</span>
                            </div>
                            <div className="method-item">
                                <span className="method-label"><div className="m-dot upi-dot"></div> UPI</span>
                                <span className="method-value fw-bold">{formatCurrency(methodStats.UPI)}</span>
                            </div>
                            <div className="method-item">
                                <span className="method-label"><div className="m-dot card-dot"></div> Card</span>
                                <span className="method-value fw-bold">{formatCurrency(methodStats.Card)}</span>
                            </div>
                            <div className="method-item">
                                <span className="method-label"><div className="m-dot ins-dot"></div> Insurance</span>
                                <span className="method-value fw-bold">{formatCurrency(methodStats.Insurance)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Revenue;
