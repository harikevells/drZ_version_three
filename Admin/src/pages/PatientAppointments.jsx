import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import {
  FaEye, FaTimes, FaUserMd, FaShieldAlt, FaUser, FaBriefcase, FaPhone,
  FaEnvelope, FaCalendarAlt, FaFileInvoice, FaUsers, FaWhatsapp,
  FaMobileAlt, FaCalendarDay, FaClock, FaVideo, FaRupeeSign,
  FaCreditCard, FaFileInvoiceDollar, FaCheckCircle, FaUserTie, FaTags, FaTimesCircle
} from 'react-icons/fa';
import Pagination from '../components/Pagination';
import AdminAppointmentCreate from './AdminAppointmentCreate';
import doctorImage from '../assets/doctorimage.webp';
import './PatientAppointments.css';

const removeTamil = (text) => {
  if (!text) return '';
  const strText = String(text);
  return strText.split(',').map(item => item.split('/')[0].trim()).join(', ');
};

const formatTimeSlot = (timeStr) => {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  if (str.toLowerCase().includes('to') || str.includes('-')) return str;

  const match = str.match(/(\d+)[:.](\d+)\s*(am|pm)/i);
  if (!match) return str;

  let hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const ampm = match[3].toLowerCase();

  let hrs24 = hrs;
  if (ampm === 'pm' && hrs24 < 12) hrs24 += 12;
  if (ampm === 'am' && hrs24 === 12) hrs24 = 0;

  let eMins = mins;
  let eHrs = hrs24 + 1;
  if (eHrs >= 24) { eHrs -= 24; }

  const eAmpm = eHrs >= 12 ? 'pm' : 'am';
  let dHrs = eHrs % 12;
  if (dHrs === 0) dHrs = 12;

  const eMinsStr = eMins < 10 ? '0' + eMins : eMins;
  return `${str} to ${dHrs}.${eMinsStr}${eAmpm}`;
};

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const matchDate = (itemDate, selectedDate) => {
    if (!selectedDate) return true;
    if (!itemDate) return false;

    const [y, m, d] = selectedDate.split('-');
    const selectedDDMMYYYY = `${d}/${m}/${y}`;
    const selectedDDMMDotYYYY = `${d}/${m}.${y}`;
    const selectedDDMMDotYYYYAlt = `${parseInt(d, 10)}/${parseInt(m, 10)}.${y}`;
    const selectedDDMMYYYYAlt = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;

    const cleanItemDate = String(itemDate).replace(/\s+/g, '');

    return (
      cleanItemDate === selectedDate ||
      cleanItemDate === selectedDDMMYYYY ||
      cleanItemDate === selectedDDMMDotYYYY ||
      cleanItemDate === selectedDDMMDotYYYYAlt ||
      cleanItemDate === selectedDDMMYYYYAlt ||
      cleanItemDate.includes(selectedDDMMYYYY) ||
      cleanItemDate.includes(selectedDDMMDotYYYY)
    );
  };

  const filteredAppointments = appointments.filter(appt => {
    if (!matchDate(appt.appointment_date, dateFilter)) {
      return false;
    }

    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const patientName = String(appt.patient_name || '').toLowerCase();
    const docNameClean = String(removeTamil(appt.doctor_name)).toLowerCase();
    const docNameRaw = String(appt.doctor_name || '').toLowerCase();
    const bookingId = String(appt.booking_id || appt.id || appt._id || '').toLowerCase();
    const status = String(appt.status || 'Pending').toLowerCase();

    return (
      patientName.includes(search) ||
      docNameClean.includes(search) ||
      docNameRaw.includes(search) ||
      bookingId.includes(search) ||
      status.includes(search)
    );
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchAppointmentsAndDoctors();
  }, []);

  const fetchAppointmentsAndDoctors = async () => {
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
        setAppointments(apptData);
        setDoctors(docsData);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <div className="patient-appointments-container">
      {isCreating ? (
        <AdminAppointmentCreate
          onCancel={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            setLoading(true);
            fetchAppointmentsAndDoctors();
          }}
        />
      ) : (
        <>
          <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px', flexWrap: 'wrap' }}>
            <h2>Appointments</h2>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none', color: '#4b5563' }}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', width: '250px', outline: 'none' }}
              />
              <button
                className="create-btn"
                onClick={() => setIsCreating(true)}
              >
                + Create Appointment
              </button>
            </div>
          </div>

          {/* Top 5 Stat Cards */}
          <div className="pharmacy-stats-wrapper" style={{ marginBottom: '20px', width: '100%' }}>
            <div className="top-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
              
              {/* Box 1: Today's Appointments */}
              <div className="top-stat-card" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dcfce7', color: '#15803d' }}>
                      <FaCalendarDay size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#64748b' }}>Today's Appointments</span>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                        {appointments.filter(a => {
                          const today = new Date();
                          const d = String(today.getDate()).padStart(2, '0');
                          const m = String(today.getMonth() + 1).padStart(2, '0');
                          const y = today.getFullYear();
                          return matchDate(a.appointment_date, `${y}-${m}-${d}`);
                        }).length}
                      </h2>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', width: '100%' }}>
                    <span style={{ color: '#15803d', fontSize: '11px', fontWeight: '500' }}>Scheduled for today</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Pending */}
              <div className="top-stat-card" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', color: '#b45309' }}>
                      <FaClock size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#64748b' }}>Pending</span>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                        {appointments.filter(a => (a.status || 'Pending').toLowerCase() === 'pending').length}
                      </h2>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', width: '100%' }}>
                    <span style={{ color: '#b45309', fontSize: '11px', fontWeight: '500' }}>Awaiting confirmation</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Approved */}
              <div className="top-stat-card" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0e7ff', color: '#4338ca' }}>
                      <FaCheckCircle size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#64748b' }}>Approved</span>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                        {appointments.filter(a => (a.status || '').toLowerCase() === 'approved').length}
                      </h2>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', width: '100%' }}>
                    <span style={{ color: '#4338ca', fontSize: '11px', fontWeight: '500' }}>Approved visits</span>
                  </div>
                </div>
              </div>

              {/* Box 4: Completed Appointments */}
              <div className="top-stat-card" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3e8ff', color: '#7e22ce' }}>
                      <FaCheckCircle size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#64748b' }}>Completed</span>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                        {appointments.filter(a => (a.status || '').toLowerCase() === 'completed' || (a.status || '').toLowerCase() === 'done').length}
                      </h2>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', width: '100%' }}>
                    <span style={{ color: '#7e22ce', fontSize: '11px', fontWeight: '500' }}>Completed appointments</span>
                  </div>
                </div>
              </div>

              {/* Box 5: Cancelled */}
              <div className="top-stat-card" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #eef2f6', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fce7f3', color: '#be185d' }}>
                      <FaTimesCircle size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px', color: '#64748b' }}>Cancelled</span>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                        {appointments.filter(a => (a.status || '').toLowerCase() === 'cancelled').length}
                      </h2>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', width: '100%' }}>
                    <span style={{ color: '#be185d', fontSize: '11px', fontWeight: '500' }}>Cancelled visits</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <p className="loading-text">Loading appointments...</p>
            ) : (
              <>
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Patient Name</th>
                      <th>Doctor Name</th>
                      <th>Appointment Date</th>
                      <th>Appointment Time</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAppointments.length > 0 ? paginatedAppointments.map((appt) => {
                      const typeStr = (appt.appointment_type || '').toLowerCase();
                      const isOnline = typeStr.includes('online') || appt.video_call === 'Yes';
                      
                      return (
                        <tr key={appt.id || appt._id}>
                          <td>{appt.booking_id || '0000'}</td>
                          <td>{appt.patient_name}</td>
                          <td>{removeTamil(appt.doctor_name)}</td>
                          <td>{appt.appointment_date ? appt.appointment_date.replace(/\s+/g, '') : ''}</td>
                          <td>{formatTimeSlot(appt.appointment_time)}</td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: isOnline ? '#f3e8ff' : '#e0e7ff',
                              color: isOnline ? '#7e22ce' : '#4338ca'
                            }}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${(appt.status || 'Pending').toLowerCase()}`}>
                              {appt.status || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <button className="view-btn" onClick={() => handleView(appt)}>
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="8" className="text-center">No appointments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredAppointments.length}
                  itemsPerPage={itemsPerPage}
                />
              </>
            )}
          </div>

          {isModalOpen && selectedAppointment && (
            <div className="modal-overlay">
              <div className="modal-content format">
                <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#eef2ff', padding: '8px', borderRadius: '8px', color: '#4f46e5', display: 'flex' }}>
                      <FaCalendarAlt size={16} />
                    </div>
                    <h3 style={{ color: '#1e293b', fontWeight: '700', fontSize: '18px', margin: 0 }}>Appointment Details</h3>
                  </div>
                  <button className="close-btn" style={{ background: '#f8fafc', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }} onClick={closeModal}>
                    <FaTimes size={14} />
                  </button>
                </div>
                <div className="modal-scroll-area">
                  <div className="modal-body-grid" style={{ gridTemplateColumns: '0.8fr 1.6fr', padding: '10px 25px 25px 25px', gap: '20px' }}>

                    {/* Doctor Details Card */}
                    <div className="ap-card ap-card-blue">
                      <div className="ap-card-header ap-header-blue">
                        <FaUserMd />
                        <span>Doctor Details</span>
                      </div>

                      {(() => {
                        const doctor = doctors.find(d => d.doctorName === selectedAppointment.doctor_name);
                        const docName = doctor ? removeTamil(doctor.doctorName) : removeTamil(selectedAppointment.doctor_name);
                        const docAvatar = doctorImage;
                        const dept = doctor ? (removeTamil(doctor.department) || 'Specialist') : 'Specialist';

                        return (
                          <div className="ap-card-body">
                            <div className="ap-doc-profile">
                              <img src={docAvatar} alt="Doctor" className="ap-doc-avatar" />
                              <div className="ap-doc-info">
                                <h4>{docName}</h4>
                                <div className="ap-badge-blue">
                                  <FaShieldAlt size={10} />
                                  <span>Specialist</span>
                                </div>
                                <p className="ap-doc-dept">{dept}</p>
                              </div>
                            </div>

                            <div className="ap-info-list" style={{ marginTop: '20px' }}>
                              <div className="ap-info-item">
                                <div className="ap-icon-box ap-icon-blue"><FaUser size={12} /></div>
                                <span className="ap-info-label">Gender</span>
                                <span className="ap-info-value">{doctor ? (doctor.gender || 'N/A') : 'N/A'}</span>
                              </div>
                              <div className="ap-info-item">
                                <div className="ap-icon-box ap-icon-blue"><FaBriefcase size={12} /></div>
                                <span className="ap-info-label">Experience</span>
                                <span className="ap-info-value">{doctor ? (doctor.experience || 'N/A') : 'N/A'}</span>
                              </div>
                              <div className="ap-info-item">
                                <div className="ap-icon-box ap-icon-blue"><FaPhone size={12} /></div>
                                <span className="ap-info-label">Mobile</span>
                                <span className="ap-info-value">{doctor ? (doctor.mobile || 'N/A') : 'N/A'}</span>
                              </div>
                              <div className="ap-info-item">
                                <div className="ap-icon-box ap-icon-blue"><FaEnvelope size={12} /></div>
                                <span className="ap-info-label">Email</span>
                                <span className="ap-info-value" style={{ fontSize: '12px' }}>{doctor ? (doctor.email || 'N/A') : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Patient & Appointment Card */}
                    <div className="ap-card ap-card-green">
                      <div className="ap-card-header ap-header-green">
                        <FaCalendarAlt />
                        <span>Patient & Appointment</span>
                      </div>
                      <div className="ap-card-body">
                        <div className="ap-grid-2col">

                          {/* Col 1 */}
                          <div className="ap-info-list">
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-purple"><FaFileInvoice size={12} /></div>
                              <span className="ap-info-label">Booking ID</span>
                              <span className="ap-info-value ap-text-purple">{selectedAppointment.booking_id || '0000'}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-blue"><FaUser size={12} /></div>
                              <span className="ap-info-label">Patient Name</span>
                              <span className="ap-info-value">{selectedAppointment.patient_name}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-purple"><FaUsers size={12} /></div>
                              <span className="ap-info-label">Age / Gender</span>
                              <span className="ap-info-value">{selectedAppointment.patient_age || 'N/A'} / {selectedAppointment.patient_gender || 'N/A'}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-green"><FaWhatsapp size={12} /></div>
                              <span className="ap-info-label">WhatsApp</span>
                              <span className="ap-info-value">{selectedAppointment.whatsapp_number || 'N/A'}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-blue"><FaMobileAlt size={12} /></div>
                              <span className="ap-info-label">Login Mobile</span>
                              <span className="ap-info-value">{selectedAppointment.login_mobile || 'N/A'}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-purple"><FaCalendarDay size={12} /></div>
                              <span className="ap-info-label">Date</span>
                              <span className="ap-info-value">{selectedAppointment.appointment_date ? selectedAppointment.appointment_date.replace(/\s+/g, '') : ''}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-purple"><FaClock size={12} /></div>
                              <span className="ap-info-label">Time</span>
                              <span className="ap-info-value" style={{ fontSize: '11px' }}>{formatTimeSlot(selectedAppointment.appointment_time)}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-blue"><FaTags size={12} /></div>
                              <span className="ap-info-label">Appt Type</span>
                              <span className="ap-info-value">{selectedAppointment.appointment_type || 'Offline'}</span>
                            </div>
                          </div>

                          {/* Col 2 */}
                          <div className="ap-info-list">
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-green"><FaVideo size={12} /></div>
                              <span className="ap-info-label">Video Call</span>
                              <span className="ap-info-value ap-text-green">{selectedAppointment.video_call || 'No'}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-blue"><FaRupeeSign size={12} /></div>
                              <span className="ap-info-label">Consult Fee</span>
                              <span className="ap-info-value ap-text-blue" style={{ fontSize: '15px', fontWeight: '700' }}>₹{selectedAppointment.consultation_fee || 0}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-orange"><FaCreditCard size={12} /></div>
                              <span className="ap-info-label">Payment Method</span>
                              <span className="ap-info-value">{selectedAppointment.payment_method || 'N/A'}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-green"><FaFileInvoiceDollar size={12} /></div>
                              <span className="ap-info-label">Payment Status</span>
                              <span className={`ap-info-value ${(selectedAppointment.payment_status || 'Pending') === 'Paid' ? 'ap-text-green' : 'ap-text-orange'}`}>{selectedAppointment.payment_status || 'Pending'}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-purple"><FaShieldAlt size={12} /></div>
                              <span className="ap-info-label">Payment ID</span>
                              <span className="ap-info-value" style={{ fontSize: '11px' }}>{selectedAppointment.payment_id || 'N/A'}</span>
                            </div>
                            <div className="ap-info-item">
                              <div className="ap-icon-box ap-icon-orange"><FaUserTie size={12} /></div>
                              <span className="ap-info-label">Created By</span>
                              <span className="ap-info-value">{selectedAppointment.created_by || 'Patient'}</span>
                            </div>

                            <div className="ap-status-box" style={{ marginTop: 'auto', marginBottom: '8px' }}>
                              <FaCheckCircle className="ap-text-green" style={{ fontSize: '16px' }} />
                              <span className="ap-info-label" style={{ flexGrow: 1 }}>Status</span>
                              <span className="ap-status-badge ap-text-green">
                                {selectedAppointment.status || 'Pending'}
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                  </div>


                  {selectedAppointment.prescription && selectedAppointment.prescription.length > 0 && (
                    <div style={{ padding: '0 25px 25px 25px' }}>
                      <h4 className="column-title">Prescription Details</h4>
                      <div className="table-container" style={{ padding: '0', boxShadow: 'none' }}>
                        <table className="appointments-table">
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Medicine Name</th>
                              <th>Time</th>
                              <th>Intake</th>
                              <th>Days</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAppointment.prescription.map((med, index) => (
                              <tr key={med.id || index}>
                                <td>{index + 1}</td>
                                <td>{med.name}</td>
                                <td>{med.timing}</td>
                                <td>{med.intake}</td>
                                <td>{med.days || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientAppointments;
