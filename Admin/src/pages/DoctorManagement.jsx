import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import Pagination from '../components/Pagination';
import './DoctorManagement.css';

const DEPARTMENT_OPTIONS = [
  'General', 'General Medicine', 'Cardiology', 'Neurology','Psychotherapy', 'Orthopedics', 'Pediatrics', 
  'Dermatology', 'General Surgery', 'Psychiatry', 'Gynecology',
  'Oncology', 'Ophthalmology', 'Urology', 'ENT', 'Dentistry', 'Radiology',
  
];

const removeTamil = (text) => {
  if (!text) return '';
  const strText = String(text);
  return strText.split(',').map(item => item.split('/')[0].trim()).join(', ');
};

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctorName: '',
    gender: 'Male',
    department: '',
    experience: '',
    email: '',
    mobile: '',
    password: '',
    fees: '',
    activeStatus: true
  });
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredDoctors = doctors.filter(doctor => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    
    const nameClean = String(removeTamil(doctor.doctorName)).toLowerCase();
    const nameRaw = String(doctor.doctorName || '').toLowerCase();
    const deptClean = String(removeTamil(doctor.department)).toLowerCase();
    const deptRaw = String(doctor.department || '').toLowerCase();
    const email = String(doctor.email || '').toLowerCase();
    const mobile = String(doctor.mobile || '').toLowerCase();
    
    return (
      nameClean.includes(search) || 
      nameRaw.includes(search) || 
      deptClean.includes(search) || 
      deptRaw.includes(search) || 
      email.includes(search) || 
      mobile.includes(search)
    );
  });

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchDoctors = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDepartmentChange = (selectedArray) => {
    setFormData(prev => ({
      ...prev,
      department: selectedArray.join(', ')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department || formData.department.trim() === '') {
      alert("Please select at least one department.");
      return;
    }
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`${API_BASE_URL}/doctors/${editingId}`, formData, config);
      } else {
        await axios.post(`${API_BASE_URL}/doctors`, formData, config);
      }
      
      setFormData({
        doctorName: '',
        gender: 'Male',
        department: '',
        experience: '',
        email: '',
        mobile: '',
        password: '',
        fees: '',
        activeStatus: true
      });
      setEditingId(null);
      fetchDoctors();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (doctor) => {
    setFormData({
      doctorName: removeTamil(doctor.doctorName),
      gender: doctor.gender,
      department: removeTamil(doctor.department),
      experience: doctor.experience,
      email: doctor.email,
      mobile: doctor.mobile,
      password: doctor.password || '',
      fees: doctor.fees || '',
      activeStatus: doctor.activeStatus === 1 || doctor.activeStatus === true || doctor.activeStatus === 'true'
    });
    setEditingId(doctor.id);
    
    // Scroll to top
    const wrapper = document.querySelector('.content-wrapper');
    if (wrapper) {
      wrapper.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const token = sessionStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/doctors/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchDoctors();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Doctor Management</h1>
      
      <div className="form-card">
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-grid">
            <div className="form-group">
              <label>Doctor Name</label>
              <input type="text" name="doctorName" placeholder="Ravi" value={formData.doctorName} onChange={handleInputChange} required />
            </div>
            
            <div className="form-group">
              <label>Gender</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleInputChange} /> Male
                </label>
                <label className="radio-label">
                  <input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleInputChange} /> Female
                </label>
                <label className="radio-label">
                  <input type="radio" name="gender" value="Other" checked={formData.gender === 'Other'} onChange={handleInputChange} /> Other
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Department</label>
              <MultiSelectDropdown 
                options={DEPARTMENT_OPTIONS}
                selectedValues={formData.department ? formData.department.split(', ').filter(Boolean) : []}
                onChange={handleDepartmentChange}
                placeholder="Select Departments"
              />
            </div>
            
            <div className="form-group">
              <label>Experience</label>
              <input type="text" name="experience" placeholder="5 Yrs" value={formData.experience} onChange={handleInputChange} required />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="Ravi123@gmail.com" value={formData.email} onChange={handleInputChange} autoComplete="off" required />
            </div>
            
            <div className="form-group">
              <label>Mobile</label>
              <input type="text" name="mobile" placeholder="9787526343" value={formData.mobile} onChange={handleInputChange} required />
            </div>
            
            <div className="form-group">
              <label>Consult Fee</label>
              <input type="text" name="fees" placeholder="500" value={formData.fees} onChange={handleInputChange} required />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder={editingId ? "Leave blank to keep unchanged" : "Enter Password"} 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  autoComplete="new-password"
                  required={!editingId} 
                />
                <button 
                  type="button" 
                  className="eye-icon-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="form-group toggle-group">
            <label>Active Status</label>
            <label className="switch">
              <input type="checkbox" name="activeStatus" checked={formData.activeStatus} onChange={handleInputChange} />
              <span className="slider round"></span>
            </label>
          </div>
          
          <div className="form-actions-center">
            <button type="submit" className="submit-btn">{editingId ? 'Update' : 'Submit'}</button>
            {editingId && (
              <button 
                type="button" 
                className="submit-btn" 
                style={{marginLeft: '10px', backgroundColor: '#e5e7eb', color: 'black'}} 
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    doctorName: '',
                    gender: 'Male',
                    department: '',
                    experience: '',
                    email: '',
                    mobile: '',
                    password: '',
                    fees: '',
                    activeStatus: true
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <h2 className="list-title">List:</h2>
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', width: '250px', outline: 'none' }}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Doctor Name</th>
              <th>Department</th>
              <th>Experience</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Consult Fee</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDoctors.map(doctor => {
              const cleanDept = doctor.department ? removeTamil(doctor.department) : '';
              const departments = cleanDept ? cleanDept.split(', ') : [];
              const visibleDepartments = departments.slice(0, 2);
              const hiddenDepartments = departments.slice(2);
              
              return (
              <tr key={doctor.id}>
                <td>{removeTamil(doctor.doctorName)}</td>
                <td>
                  <div className="dept-cell">
                    {visibleDepartments.join(', ')}
                    {hiddenDepartments.length > 0 && (
                      <div className="tooltip-container">
                        <span className="dept-badge">+{hiddenDepartments.length}</span>
                        <div className="tooltip-text">{hiddenDepartments.join(', ')}</div>
                      </div>
                    )}
                  </div>
                </td>
                <td>{doctor.experience}</td>
                <td>{doctor.email}</td>
                <td>{doctor.mobile}</td>
                <td>₹{doctor.fees || 0}</td>
                <td className="actions-cell">
                  <button className="action-btn" onClick={() => handleEdit(doctor)}>
                    <FaEdit />
                  </button>
                  <button className="action-btn" onClick={() => handleDelete(doctor.id)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
              );
            })}
            {filteredDoctors.length === 0 && (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No doctors found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredDoctors.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default DoctorManagement;
