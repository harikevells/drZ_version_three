import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { FaEye, FaTimes, FaUser } from 'react-icons/fa';
import Pagination from '../components/Pagination';
import './PatientList.css';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredPatients = patients.filter(patient => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const patientId = String(patient.patient_id || '').toLowerCase();
    const patientName = String(patient.patient_name || '').toLowerCase();
    const identifier = String(patient.identifier || '').toLowerCase();
    const bloodGroup = String(patient.blood_group || '').toLowerCase();
    const gender = String(patient.gender || '').toLowerCase();
    const dob = String(patient.dob || '').toLowerCase();

    return (
      patientId.includes(search) ||
      patientName.includes(search) ||
      identifier.includes(search) ||
      bloodGroup.includes(search) ||
      gender.includes(search) ||
      dob.includes(search)
    );
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await fetch(`${API_BASE_URL}/auth/patients`, config);

      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        console.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };



  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  return (
    <div className="patient-list-container">
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px', flexWrap: 'wrap' }}>
        <h2>Patient List</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search patients..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', width: '250px', outline: 'none' }}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <p className="loading-text">Loading patients...</p>
        ) : (
          <>
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Date of Birth</th>
                  <th>Phone / Email ID</th>
                  <th>Blood Group</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.length > 0 ? paginatedPatients.map((patient) => (
                  <tr key={patient.id || patient._id}>
                    <td>{patient.patient_id || 'N/A'}</td>
                    <td>{patient.patient_name || 'N/A'}</td>
                    <td>{patient.patient_age || 'N/A'}</td>
                    <td>{patient.gender || 'N/A'}</td>
                    <td>{patient.dob || 'N/A'}</td>
                    <td>{patient.identifier || 'N/A'}</td>
                    <td>{patient.blood_group || 'N/A'}</td>
                    <td>
                      <button className="view-btn" onClick={() => handleView(patient)}>
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="text-center">No patients found</td>
                  </tr>
                )}
              </tbody>
            </table>

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredPatients.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </div>

      {isModalOpen && selectedPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Details</h3>
              <button className="close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body-grid">
              {/* Left Side: Profile Picture and Basic Info */}
              <div className="profile-column">
                <div className="profile-image-container">
                  {selectedPatient.profileImage ? (
                    <img 
                      src={selectedPatient.profileImage} 
                      alt={selectedPatient.patient_name} 
                      className="profile-image"
                    />
                  ) : (
                    <FaUser className="profile-placeholder-icon" />
                  )}
                </div>
                <h4 className="profile-patient-name">{selectedPatient.patient_name || 'N/A'}</h4>
                <p className="profile-patient-id">{selectedPatient.patient_id || 'N/A'}</p>
              </div>

              {/* Right Side: Detailed Fields */}
              <div className="detail-column">
                <h4 className="column-title">Detailed Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Phone / Email:</span>
                  <span className="detail-value">{selectedPatient.identifier || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Age:</span>
                  <span className="detail-value">{selectedPatient.patient_age || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Gender:</span>
                  <span className="detail-value">{selectedPatient.gender || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date of Birth:</span>
                  <span className="detail-value">{selectedPatient.dob || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Blood Group:</span>
                  <span className="detail-value">{selectedPatient.blood_group || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Emergency Contact:</span>
                  <span className="detail-value">{selectedPatient.emergency_contact || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Street Address:</span>
                  <span className="detail-value">{selectedPatient.street || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Area:</span>
                  <span className="detail-value">{selectedPatient.area || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">District:</span>
                  <span className="detail-value">{selectedPatient.district || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">State:</span>
                  <span className="detail-value">{selectedPatient.state || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
