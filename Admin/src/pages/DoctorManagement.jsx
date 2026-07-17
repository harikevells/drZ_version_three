import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import Pagination from '../components/Pagination';
import './DoctorManagement.css';

const DEPARTMENT_OPTIONS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 
  'Dermatology', 'General Surgery', 'Psychiatry', 'Gynecology',
  'Oncology', 'Ophthalmology', 'Urology', 'ENT', 'Dentistry', 'Radiology'
];

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
    activeStatus: true
  });
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const [searchTerm, setSearchTerm] = useState('');

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const removeTamil = (text) => {
    if (!text) return text;
    return text.split(',').map(item => item.split('/')[0].trim()).join(', ');
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
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`http://localhost:5000/api/doctors/${editingId}`, formData, config);
      } else {
        await axios.post('http://localhost:5000/api/doctors', formData, config);
      }
      
      setFormData({
        doctorName: '',
        gender: 'Male',
        department: '',
        experience: '',
        email: '',
        mobile: '',
        password: '',
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
      activeStatus: doctor.activeStatus === 1 || doctor.activeStatus === true || doctor.activeStatus === 'true'
    });
    setEditingId(doctor.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/doctors/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchDoctors();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (doc.doctorName || '').toLowerCase().includes(searchLower) ||
      (doc.department || '').toLowerCase().includes(searchLower) ||
      (doc.email || '').toLowerCase().includes(searchLower) ||
      (doc.mobile || '').toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
            <div className="form-group toggle-group">
              <label>Active Status</label>
              <div 
                className={`toggle-switch ${formData.activeStatus ? 'active' : ''}`} 
                onClick={() => setFormData(prev => ({ ...prev, activeStatus: !prev.activeStatus }))}
              >
                <div className="toggle-circle"></div>
              </div>
            </div>
          </div>
          
          <div className="form-actions-center">
            <button type="submit" className="submit-btn">{editingId ? 'Update' : 'Submit'}</button>
          </div>
        </form>
      </div>

      <div className="list-header">
        <h2 className="list-title">List:</h2>
      </div>

      <div className="filters-container">
        <input 
          type="text" 
          placeholder="Search by Name, Department, Email, or Mobile..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-filter-btn" onClick={() => setSearchTerm('')}>Clear</button>
        )}
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
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(doctor => {
              const cleanDept = doctor.department ? removeTamil(doctor.department) : '';
              const departments = cleanDept ? cleanDept.split(', ') : [];
              const visibleDepartments = departments.slice(0, 3);
              const hiddenDepartments = departments.slice(3);
              
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
                <td className={doctor.activeStatus ? 'status-active' : 'status-inactive'}>
                  {doctor.activeStatus ? 'Active' : 'Inactive'}
                </td>
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
        totalPages={Math.ceil(filteredDoctors.length / itemsPerPage)} 
        onPageChange={setCurrentPage} 
      />
    </div>
  );
};

export default DoctorManagement;
