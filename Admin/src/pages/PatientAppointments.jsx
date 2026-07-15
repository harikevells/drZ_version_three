import React, { useState, useEffect } from 'react';
import { FaEye, FaTimes } from 'react-icons/fa';
import Pagination from '../components/Pagination';
import './PatientAppointments.css';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const removeTamil = (text) => {
    if (!text) return text;
    return text.split(',').map(item => item.split('/')[0].trim()).join(', ');
  };

  useEffect(() => {
    fetchAppointmentsAndDoctors();
  }, []);

  const fetchAppointmentsAndDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [apptRes, docsRes] = await Promise.all([
        fetch('http://localhost:5000/api/emails/all-appointments', config),
        fetch('http://localhost:5000/api/doctors', config)
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

  const filteredAppointments = appointments.filter(appt => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (appt.patient_name || '').toLowerCase().includes(searchLower) ||
      (appt.doctor_name || '').toLowerCase().includes(searchLower) ||
      ((appt.id || appt._id) || '').toLowerCase().includes(searchLower) ||
      (appt.appointment_time || '').toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (filterDate) {
      const [y, m, d] = filterDate.split('-');
      const normalizedFilter = `${d}/${m}/${y}`;
      const apptDate = appt.appointment_date || '';
      matchesDate = apptDate.replace(/\s+/g, '') === normalizedFilter.replace(/\s+/g, '');
    }

    return matchesSearch && matchesDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate]);

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
      <div className="header-section">
        <h2>Patient Appointments</h2>
      </div>

      <div className="filters-container">
        <input 
          type="text" 
          placeholder="Search by Patient, Doctor, or ID..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <input 
          type="date" 
          value={filterDate} 
          onChange={(e) => setFilterDate(e.target.value)}
          className="date-input"
        />
        {(searchTerm || filterDate) && (
          <button className="clear-filter-btn" onClick={() => { setSearchTerm(''); setFilterDate(''); }}>Clear</button>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <p className="loading-text">Loading appointments...</p>
        ) : (
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
              {filteredAppointments.length > 0 ? filteredAppointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((appt) => (
                <tr key={appt.id || appt._id}>
                  <td>{(appt.id || appt._id).slice(-6).toUpperCase()}</td>
                  <td>{appt.patient_name}</td>
                  <td>{removeTamil(appt.doctor_name)}</td>
                  <td>{appt.appointment_date}</td>
                  <td>{appt.appointment_time}</td>
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
        )}
      </div>
      
      {!loading && filteredAppointments.length > 0 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={Math.ceil(filteredAppointments.length / itemsPerPage)} 
          onPageChange={setCurrentPage} 
        />
      )}

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
                  <span className="detail-value">{selectedAppointment.appointment_date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">{selectedAppointment.appointment_time}</span>
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
