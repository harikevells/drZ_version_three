import React, { useState, useEffect } from 'react';
import { FaUtensils, FaEdit, FaTrashAlt } from 'react-icons/fa';
import axios from 'axios';
import Pagination from '../components/Pagination';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import './CreateMedicineIntake.css';

const CreateMedicineIntake = () => {
  const [intakes, setIntakes] = useState([]);
  const [timings, setTimings] = useState([]);
  const [formData, setFormData] = useState({
    intake: '',
    description: ''
  });
  const [selectedTitles, setSelectedTitles] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [intakesRes, timingsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/medicine-intakes', config),
        axios.get('http://localhost:5000/api/medicine-timings', config)
      ]);
      
      setIntakes(intakesRes.data);
      setTimings(timingsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.intake || selectedTitles.length === 0 || !formData.description) {
      alert("Please fill all required fields and select at least one title.");
      return;
    }

    const payload = {
      ...formData,
      title: selectedTitles,
      activeStatus: isActive
    };

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/medicine-intakes/${editingId}`, payload, config);
        alert('Intake updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/medicine-intakes', payload, config);
        alert('Intake created successfully!');
      }
      
      setFormData({ intake: '', description: '' });
      setSelectedTitles([]);
      setIsActive(true);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (intakeObj) => {
    setEditingId(intakeObj._id);
    setFormData({
      intake: intakeObj.intake,
      description: intakeObj.description
    });
    setSelectedTitles(intakeObj.title || []);
    setIsActive(intakeObj.activeStatus);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this intake?")) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`http://localhost:5000/api/medicine-intakes/${id}`, config);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Error deleting intake');
      }
    }
  };

  return (
    <div className="medicine-intake-container">
      <div className="medicine-header-section">
        <div className="medicine-header-title">
          <h2>Medicine Management <span className="header-icon"><FaUtensils /></span></h2>
          <p className="subtitle">{editingId ? 'Edit Intake' : 'Create Intake'}</p>
        </div>
      </div>

      <div className="medicine-content-area">
        <div className="medicine-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Intake</label>
                <input 
                  type="text" 
                  name="intake"
                  value={formData.intake}
                  onChange={handleInputChange}
                  className="form-input" 
                  placeholder="e.g. Before Food"
                  required
                />
              </div>
              <div className="form-group">
                <label>Title</label>
                <MultiSelectDropdown 
                  options={timings.length > 0 ? timings.map(t => t.title) : ['Morning', 'Afternoon', 'Night']} 
                  selectedValues={selectedTitles} 
                  onChange={setSelectedTitles} 
                  placeholder="Select Timing Titles" 
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
                    setFormData({ intake: '', description: '' });
                    setSelectedTitles([]);
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
                  <th>Intake</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {intakes.length > 0 ? (
                  intakes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((intakeObj, idx) => (
                    <tr key={intakeObj._id || idx}>
                      <td className="title-cell">{intakeObj.intake}</td>
                      <td>
                        <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                          {Array.isArray(intakeObj.title) ? intakeObj.title.map((t, i) => (
                            <span key={i} style={{background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', color: '#4b5563'}}>
                              {t}
                            </span>
                          )) : (
                            <span style={{background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', color: '#4b5563'}}>
                              {intakeObj.title}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="desc-cell">{intakeObj.description}</td>
                      <td className={`status-cell ${intakeObj.activeStatus ? 'active' : 'inactive'}`} style={{color: intakeObj.activeStatus ? '#10b981' : '#ef4444'}}>
                        {intakeObj.activeStatus ? 'Active' : 'Inactive'}
                      </td>
                      <td className="action-cell">
                        <div className="action-buttons">
                          <button className="table-action-btn edit-btn" onClick={() => handleEditClick(intakeObj)}><FaEdit /></button>
                          <button className="table-action-btn delete-btn" onClick={() => handleDelete(intakeObj._id)}><FaTrashAlt /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>No intakes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {intakes.length > itemsPerPage && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(intakes.length / itemsPerPage)} 
              onPageChange={setCurrentPage} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMedicineIntake;
