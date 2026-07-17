import React, { useState, useEffect } from 'react';
import { FaClock, FaEdit, FaTrashAlt } from 'react-icons/fa';
import axios from 'axios';
import Pagination from '../components/Pagination';
import './CreateMedicineTiming.css';

const CreateMedicineTiming = () => {
  const [timings, setTimings] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchTimings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/medicine-timings', config);
      setTimings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTimings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert("Please fill all required fields.");
      return;
    }

    const payload = {
      ...formData,
      activeStatus: isActive
    };

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/medicine-timings/${editingId}`, payload, config);
        alert('Timing updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/medicine-timings', payload, config);
        alert('Timing created successfully!');
      }
      
      setFormData({ title: '', description: '' });
      setIsActive(true);
      setEditingId(null);
      fetchTimings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (timing) => {
    setEditingId(timing._id);
    setFormData({
      title: timing.title,
      description: timing.description
    });
    setIsActive(timing.activeStatus);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this timing?")) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`http://localhost:5000/api/medicine-timings/${id}`, config);
        fetchTimings();
      } catch (err) {
        console.error(err);
        alert('Error deleting timing');
      }
    }
  };

  return (
    <div className="medicine-timing-container">
      <div className="medicine-header-section">
        <div className="medicine-header-title">
          <h2>Medicine Management <span className="header-icon"><FaClock /></span></h2>
          <p className="subtitle">{editingId ? 'Edit Timing' : 'Create Timing'}</p>
        </div>
      </div>

      <div className="medicine-content-area">
        <div className="medicine-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input" 
                  required
                />
              </div>
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
            </div>

            <div className="form-row align-start">
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
                    setFormData({ title: '', description: '' });
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
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {timings.length > 0 ? (
                  timings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((timing, idx) => (
                    <tr key={timing._id || idx}>
                      <td className="title-cell">{timing.title}</td>
                      <td className="desc-cell">{timing.description}</td>
                      <td className={`status-cell ${timing.activeStatus ? 'active' : 'inactive'}`} style={{color: timing.activeStatus ? '#10b981' : '#ef4444'}}>
                        {timing.activeStatus ? 'Active' : 'Inactive'}
                      </td>
                      <td className="action-cell">
                        <div className="action-buttons">
                          <button className="table-action-btn edit-btn" onClick={() => handleEditClick(timing)}><FaEdit /></button>
                          <button className="table-action-btn delete-btn" onClick={() => handleDelete(timing._id)}><FaTrashAlt /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>No timings found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {timings.length > itemsPerPage && (
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(timings.length / itemsPerPage)} 
              onPageChange={setCurrentPage} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMedicineTiming;
