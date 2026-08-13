import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { FaEye, FaTimes, FaUser, FaPhoneAlt, FaCalendarAlt, FaVenusMars, FaTint, FaMapMarkerAlt, FaCity, FaMap, FaLock, FaCheckCircle, FaRegCircle, FaShieldAlt, FaUndo, FaSave } from 'react-icons/fa';
import Pagination from '../components/Pagination';
import './PatientList.css';
import patientImage from '../assets/patientimage.png';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Registration State
  const [currentView, setCurrentView] = useState('list');
  const [registering, setRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    patient_name: '',
    patient_age: '',
    gender: 'Male',
    dob: '',
    identifier: '',
    blood_group: '',
    emergency_contact: '',
    street: '',
    area: '',
    district: '',
    state: '',
    password: '123',
    profileImage: ''
  });

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

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/patient/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(registerForm)
      });
      
      if (response.ok) {
        alert('Patient registered successfully!');
        setCurrentView('list');
        setRegisterForm({
          patient_name: '', patient_age: '', gender: 'Male', dob: '', identifier: '',
          blood_group: '', emergency_contact: '', street: '', area: '', district: '', state: '', password: '123', profileImage: ''
        });
        fetchPatients();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to register patient');
      }
    } catch (error) {
      console.error('Error registering patient:', error);
      alert('Network error. Failed to register.');
    } finally {
      setRegistering(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  // Checklist booleans
  const isPersonalComplete = registerForm.patient_name && registerForm.patient_age && registerForm.gender && registerForm.dob && registerForm.blood_group;
  const isContactComplete = registerForm.identifier;
  const isEmergencyComplete = registerForm.emergency_contact;
  const isAddressComplete = registerForm.street && registerForm.area && registerForm.district && registerForm.state;
  const isLoginComplete = registerForm.password;

  return (
    <div className="patient-list-container">
      {currentView === 'list' && (
        <>
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
              <button 
                className="patient-register-btn"
                onClick={() => setCurrentView('register')}
              >
                <FaUser style={{fontSize:'12px'}} /> Register Patient
              </button>
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
        </>
      )}

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

      {currentView === 'register' && (
        <div className="register-layout">
          <div className="register-main">
            <div className="register-header">
              <h2 style={{ color: '#1a4d80', margin: 0, fontSize: '22px' }}>Register New Patient</h2>
              <button className="back-to-list-btn" onClick={() => setCurrentView('list')}>
                ← Back to List
              </button>
            </div>
            
            <form onSubmit={handleRegisterSubmit}>
              <h3 className="form-section-title">
                <div className="section-icon-bg"><FaUser /></div>
                Personal Information
              </h3>
              
              <div className="register-form-grid">
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Patient Name <span>*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaUser /></div>
                    <input type="text" name="patient_name" required placeholder="Enter full name"
                      value={registerForm.patient_name} onChange={handleRegisterChange} />
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Phone / Email ID <span>*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaPhoneAlt /></div>
                    <input type="text" name="identifier" required placeholder="Enter phone number or email"
                      value={registerForm.identifier} onChange={handleRegisterChange} />
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Age <span>*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaCalendarAlt /></div>
                    <input type="number" name="patient_age" required placeholder="Enter age"
                      value={registerForm.patient_age} onChange={handleRegisterChange} />
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Gender <span>*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaVenusMars /></div>
                    <select name="gender" value={registerForm.gender} onChange={handleRegisterChange}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Date of Birth <span>*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaCalendarAlt /></div>
                    <input type="date" name="dob" required
                      value={registerForm.dob} onChange={handleRegisterChange} />
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Blood Group</label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaTint /></div>
                    <select name="blood_group" value={registerForm.blood_group} onChange={handleRegisterChange}>
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>

              <h3 className="form-section-title">
                <div className="section-icon-bg"><FaMapMarkerAlt /></div>
                Contact Information
              </h3>

              <div className="register-form-grid">
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Emergency Contact</label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaPhoneAlt /></div>
                    <input type="text" name="emergency_contact" placeholder="Enter emergency contact number"
                      value={registerForm.emergency_contact} onChange={handleRegisterChange} />
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Street Address <span>*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaMapMarkerAlt /></div>
                    <input type="text" name="street" required placeholder="House no, Street name, Area"
                      value={registerForm.street} onChange={handleRegisterChange} />
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Area / Locality</label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaMapMarkerAlt /></div>
                    <input type="text" name="area" placeholder="Enter area or locality"
                      value={registerForm.area} onChange={handleRegisterChange} />
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>District <span>*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaCity /></div>
                    <input type="text" name="district" required placeholder="Enter district"
                      value={registerForm.district} onChange={handleRegisterChange} />
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>State <span>*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaMap /></div>
                    <select name="state" required value={registerForm.state} onChange={handleRegisterChange}>
                      <option value="">Select state</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Maharashtra">Maharashtra</option>
                    </select>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',flexDirection:'column'}} className="input-group">
                  <label>Password <span>*</span></label>
                  <div className="input-wrapper">
                    <div className="input-icon"><FaLock /></div>
                    <input type="password" name="password" required placeholder="Create a password"
                      value={registerForm.password} onChange={handleRegisterChange} />
                  </div>
                </div>
              </div>

   
              
              <div style={{marginBottom:'0px', marginTop:'0px'}} className="form-actions">
                <button type="button" className="btn-reset" onClick={() => {
                  setRegisterForm({
                    patient_name: '', patient_age: '', gender: 'Male', dob: '', identifier: '',
                    blood_group: '', emergency_contact: '', street: '', area: '', district: '', state: '', password: '123', profileImage: ''
                  });
                }}>
                  <FaUndo /> Reset
                </button>
                <button type="submit" className="btn-save" disabled={registering}>
                  <FaSave /> {registering ? 'Registering...' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>

          <div className="register-sidebar">
            <div className="side-card" style={{ textAlign: 'center' }}>
              <div className="card-img-container" style={{ justifyContent: 'center' }}>
                <img src={patientImage} alt="Patient Info" style={{ width: '80%', height: 'auto' }} />
              </div>
              <h4>Why Accurate Information Matters</h4>
              <p>Providing accurate patient details helps us deliver better care and maintain complete medical history securely.</p>
            </div>

            <div className="side-card">
              <h4 className="checklist-title">Information Checklist</h4>
              
              <div className={`checklist-item ${isPersonalComplete ? 'completed' : ''}`}>
                {isPersonalComplete ? <FaCheckCircle className="check-icon" /> : <FaRegCircle className="check-icon" />}
                Personal details
              </div>
              
              <div className={`checklist-item ${isContactComplete ? 'completed' : ''}`}>
                {isContactComplete ? <FaCheckCircle className="check-icon" /> : <FaRegCircle className="check-icon" />}
                Contact information
              </div>
              
              <div className={`checklist-item ${isEmergencyComplete ? 'completed' : ''}`}>
                {isEmergencyComplete ? <FaCheckCircle className="check-icon" /> : <FaRegCircle className="check-icon" />}
                Emergency contact
              </div>
              
              <div className={`checklist-item ${isAddressComplete ? 'completed' : ''}`}>
                {isAddressComplete ? <FaCheckCircle className="check-icon" /> : <FaRegCircle className="check-icon" />}
                Address details
              </div>
              
              <div className={`checklist-item ${isLoginComplete ? 'completed' : ''}`}>
                {isLoginComplete ? <FaCheckCircle className="check-icon" /> : <FaRegCircle className="check-icon" />}
                Login credentials
              </div>

              <div className="mandatory-note">
                <FaLock /> All fields marked with * are mandatory
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
