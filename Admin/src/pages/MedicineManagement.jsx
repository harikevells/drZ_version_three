import React, { useState, useEffect } from 'react';
import { FaPills, FaEdit, FaTrashAlt } from 'react-icons/fa';
import axios from 'axios';
import Pagination from '../components/Pagination';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import './MedicineManagement.css';

const CATEGORY_OPTIONS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 
  'Dermatology', 'General Surgery', 'Psychiatry', 'Gynecology',
  'Oncology', 'Ophthalmology', 'Urology', 'ENT', 'Dentistry', 'Radiology'
];

const MedicineManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    medicineName: '',
    brand: '',
    medicineId: '',
    description: ''
  });
  const [isActive, setIsActive] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/medicines', config);
      setMedicines(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicineName || !formData.brand || !formData.medicineId || !formData.description || selectedCategories.length === 0) {
      alert("Please fill all required fields and select at least one category.");
      return;
    }

    const payload = {
      ...formData,
      categories: selectedCategories,
      activeStatus: isActive
    };

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/medicines/${editingId}`, payload, config);
        alert('Medicine updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/medicines', payload, config);
        alert('Medicine created successfully!');
      }
      
      setFormData({
        medicineName: '',
        brand: '',
        medicineId: '',
        description: ''
      });
      setSelectedCategories([]);
      setIsActive(true);
      setEditingId(null);
      fetchMedicines();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (med) => {
    setEditingId(med._id);
    setFormData({
      medicineName: med.medicineName,
      brand: med.brand,
      medicineId: med.medicineId,
      description: med.description
    });
    setSelectedCategories(med.categories || []);
    setIsActive(med.activeStatus);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`http://localhost:5000/api/medicines/${id}`, config);
        fetchMedicines();
      } catch (err) {
        console.error(err);
        alert('Error deleting medicine');
      }
    }
  };

  return (
    <div className="medicine-management-container">
      <div className="medicine-header-section">
        <div className="medicine-header-title">
          <h2>Medicine Management <span className="header-icon"><FaPills /></span></h2>
          <p className="subtitle">{editingId ? 'Edit Medicine' : 'Create Medicine'}</p>
        </div>
      </div>

      <div className="medicine-content-area">
        <div className="medicine-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Medicine Name</label>
                <input 
                  type="text" 
                  name="medicineName"
                  value={formData.medicineName}
                  onChange={handleInputChange}
                  className="form-input" 
                  required
                />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input 
                  type="text" 
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="form-input" 
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Medicine ID</label>
                <input 
                  type="text" 
                  name="medicineId"
                  value={formData.medicineId}
                  onChange={handleInputChange}
                  placeholder="MED 002" 
                  className="form-input" 
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <MultiSelectDropdown 
                  options={CATEGORY_OPTIONS} 
                  selectedValues={selectedCategories} 
                  onChange={setSelectedCategories} 
                  placeholder="Select categories..." 
                />
              </div>
            </div>

            <div className="form-row align-start">
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input" 
                  required
                />
              </div>
              <div className="form-group status-group">
                <label>Active Status</label>
                <div className={`toggle-switch ${isActive ? 'active' : ''}`} onClick={() => setIsActive(!isActive)}>
                  <div className="toggle-circle"></div>
                </div>
              </div>
            </div>

            <div className="submit-btn-container" style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Saving...' : (editingId ? 'Update' : 'Submit')}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  className="submit-btn" 
                  style={{backgroundColor: '#6b7280'}}
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ medicineName: '', brand: '', medicineId: '', description: '' });
                    setSelectedCategories([]);
                    setIsActive(true);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="medicine-list-card">
          <div className="list-header">
            <h3>List</h3>
          </div>
          
          <div className="medicine-table-container">
            <table className="medicine-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Medicine Id</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {medicines.length > 0 ? (
                  medicines.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((med, idx) => (
                    <tr key={med._id || idx}>
                      <td className="title-cell">{med.medicineName}</td>
                      <td>{med.medicineId}</td>
                      <td>
                        <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                          {med.categories?.map((cat, i) => (
                            <span key={i} style={{background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', color: '#4b5563'}}>
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="desc-cell">{med.description}</td>
                      <td className={`status-cell ${med.activeStatus ? 'active' : 'inactive'}`} style={{color: med.activeStatus ? '#10b981' : '#ef4444'}}>
                        {med.activeStatus ? 'Active' : 'Inactive'}
                      </td>
                      <td className="action-cell">
                        <div className="action-buttons">
                          <button className="table-action-btn edit-btn" onClick={() => handleEditClick(med)}><FaEdit /></button>
                          <button className="table-action-btn delete-btn" onClick={() => handleDelete(med._id)}><FaTrashAlt /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>No medicines found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {medicines.length > itemsPerPage && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(medicines.length / itemsPerPage)} 
              onPageChange={setCurrentPage} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineManagement;
