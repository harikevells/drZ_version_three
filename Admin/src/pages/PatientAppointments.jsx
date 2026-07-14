import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { FaEye, FaTimes } from 'react-icons/fa';
import Pagination from '../components/Pagination';
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
    const bookingId = String(appt.id || appt._id || '').toLowerCase();
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
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px', flexWrap: 'wrap' }}>
        <h2>Patient Appointments</h2>
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
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.length > 0 ? paginatedAppointments.map((appt) => (
                  <tr key={appt.id || appt._id}>
                    <td>{(appt.id || appt._id).slice(-6).toUpperCase()}</td>
                    <td>{appt.patient_name}</td>
                    <td>{removeTamil(appt.doctor_name)}</td>
                    <td>{appt.appointment_date ? appt.appointment_date.replace(/\s+/g, '') : ''}</td>
                    <td>{formatTimeSlot(appt.appointment_time)}</td>
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
                )) : (
                  <tr>
                    <td colSpan="7" className="text-center">No appointments found</td>
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
          <div className="modal-content">
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button className="close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body-grid">
              {/* Left Side: Doctor Details */}
              <div className="detail-column">
                <h4 className="column-title">Doctor Details</h4>
                {(() => {
                  const doctor = doctors.find(d => d.doctorName === selectedAppointment.doctor_name);
                  if (doctor) {
                    return (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">Name:</span>
                          <span className="detail-value">{removeTamil(doctor.doctorName)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Department:</span>
                          <span className="detail-value">{removeTamil(doctor.department) || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Gender:</span>
                          <span className="detail-value">{doctor.gender || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Experience:</span>
                          <span className="detail-value">{doctor.experience || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Mobile:</span>
                          <span className="detail-value">{doctor.mobile || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Email:</span>
                          <span className="detail-value">{doctor.email || 'N/A'}</span>
                        </div>
                      </>
                    );
                  } else {
                    return (
                      <div className="detail-row">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">{removeTamil(selectedAppointment.doctor_name)}</span>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Right Side: Patient & Appointment Details */}
              <div className="detail-column">
                <h4 className="column-title">Patient & Appointment</h4>
                <div className="detail-row">
                  <span className="detail-label">Booking ID:</span>
                  <span className="detail-value">{(selectedAppointment.id || selectedAppointment._id).slice(-6).toUpperCase()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Patient Name:</span>
                  <span className="detail-value">{selectedAppointment.patient_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Age/Gender:</span>
                  <span className="detail-value">{selectedAppointment.patient_age || 'N/A'} / {selectedAppointment.patient_gender || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">WhatsApp:</span>
                  <span className="detail-value">{selectedAppointment.whatsapp_number || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Login Mobile:</span>
                  <span className="detail-value">{selectedAppointment.login_mobile || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{selectedAppointment.appointment_date ? selectedAppointment.appointment_date.replace(/\s+/g, '') : ''}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">{formatTimeSlot(selectedAppointment.appointment_time)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Video Call:</span>
                  <span className="detail-value">{selectedAppointment.video_call || 'No'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-text ${(selectedAppointment.status || 'Pending').toLowerCase()}`}>
                    {selectedAppointment.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
