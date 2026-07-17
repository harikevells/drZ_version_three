import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaEye, FaTrashAlt, FaTimesCircle } from 'react-icons/fa';
import Pagination from '../components/Pagination';
import './PatientList.css';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
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
        
        const mappedPatients = apptData.map(appt => {
          // Find the corresponding doctor to get their department (category)
          const doctor = docsData.find(d => d.doctorName === appt.doctor_name);
          let category = 'N/A';
          if (doctor && doctor.department) {
            // Remove Tamil text (e.g., "Cardiology / கார்டியாலஜி" -> "Cardiology")
            category = doctor.department.split('/')[0].split(',')[0].trim();
          }

          return {
            name: appt.patient_name || 'Unknown',
            gender: appt.patient_gender || 'N/A',
            age: appt.patient_age || 'N/A',
            id: (appt.id || appt._id || '').slice(-6).toUpperCase() || 'N/A',
            doctor: appt.doctor_name ? appt.doctor_name.split(',')[0].trim() : 'N/A',
            date: appt.appointment_date || 'N/A',
            mobile: appt.whatsapp_number || appt.login_mobile || 'N/A',
            time: appt.appointment_time || 'N/A',
            category: category,
            video_call: appt.video_call || 'No',
            originalId: appt.id || appt._id
          };
        });
        
        setPatients(mappedPatients);
      } else {
        console.error('Failed to fetch patients or doctors');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (patient.name || '').toLowerCase().includes(searchLower) ||
      (patient.doctor || '').toLowerCase().includes(searchLower) ||
      (patient.id || '').toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (filterDate) {
      const [y, m, d] = filterDate.split('-');
      const normalizedFilter = `${d}/${m}/${y}`;
      matchesDate = (patient.date || '').replace(/\s+/g, '') === normalizedFilter.replace(/\s+/g, '');
    }

    return matchesSearch && matchesDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate]);

  const handleViewClick = (patient) => {
    setSelectedPatient(patient);
  };

  const closeModal = () => {
    setSelectedPatient(null);
  };

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <h2>Patient List <span className="header-icon"><FaUserFriends /></span></h2> 
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

      <div className="patient-table-container">
        {loading ? (
          <p style={{textAlign: 'center', padding: '20px'}}>Loading patients...</p>
        ) : (
          <table className="patient-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Gender/ Age</th>
                <th>Patient ID</th>
                <th>Doctor Name</th>
                <th>Appointment Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((patient, index) => (
                <tr key={patient.originalId || index}>
                  <td className="patient-name">{patient.name}</td>
                  <td className="patient-gender">{patient.gender} / {patient.age}</td>
                  <td className="patient-id">{patient.id}</td>
                  <td className="doctor-name">{patient.doctor}</td>
                  <td className="appointment-date">{patient.date}</td>
                  <td className="action-cell">
                    <div className="action-buttons">
                      <button className="table-action-btn view-btn" onClick={() => handleViewClick(patient)}><FaEye /></button>
                      <button className="table-action-btn delete-btn"><FaTrashAlt /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No patients found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredPatients.length > 0 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={Math.ceil(filteredPatients.length / itemsPerPage)} 
          onPageChange={setCurrentPage} 
        />
      )}

      {selectedPatient && (
        <div className="patient-modal-overlay">
          <div className="patient-modal-content">
            <button className="modal-close-btn" onClick={closeModal}>
              <FaTimesCircle />
            </button>
            <h3 className="modal-title">Patient History</h3>
            
            <div className="modal-grid">
              <div className="modal-item">
                <span className="modal-label">Patient Name</span>
                <span className="modal-value">{selectedPatient.name}</span>
              </div>
              <div className="modal-item">
                <span className="modal-label">Gender / Age</span>
                <span className="modal-value">{selectedPatient.gender} - {selectedPatient.age}</span>
              </div>
              <div className="modal-item">
                <span className="modal-label">Patient ID</span>
                <span className="modal-value">{selectedPatient.id}</span>
              </div>
              
              <div className="modal-item">
                <span className="modal-label">Mobile No</span>
                <span className="modal-value">{selectedPatient.mobile}</span>
              </div>
              <div className="modal-item">
                <span className="modal-label">Booking Time</span>
                <span className="modal-value">{selectedPatient.time}</span>
              </div>
              <div className="modal-item">
                <span className="modal-label">Category</span>
                <span className="modal-value">{selectedPatient.category}</span>
              </div>
              
              <div className="modal-item">
                <span className="modal-label">Video Call</span>
                <span className="modal-value">{selectedPatient.video_call}</span>
              </div>
              <div className="modal-item">
                <span className="modal-label">Doctor Name</span>
                <span className="modal-value">{selectedPatient.doctor}</span>
              </div>
              <div className="modal-item">
                <span className="modal-label">Appointment Date</span>
                <span className="modal-value">{selectedPatient.date}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
