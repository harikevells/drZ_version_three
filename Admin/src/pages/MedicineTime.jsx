import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { MdMedication } from "react-icons/md";
import './MedicineManagement.css';
import './PatientAppointments.css';

const MedicineTime = () => {
  const [timings, setTimings] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimings();
  }, []);

  const fetchTimings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/medicine-timings`);
      if (response.ok) {
        const data = await response.json();
        setTimings(data);
      }
    } catch (error) {
      console.error('Error fetching timings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      description,
      status: isActive ? 'Active' : 'Inactive'
    };

    try {
      const url = editingId 
        ? `${API_BASE_URL}/medicine-timings/${editingId}` 
        : `${API_BASE_URL}/medicine-timings`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        resetForm();
        fetchTimings();
      }
    } catch (error) {
      console.error('Error saving timing:', error);
    }
  };

  const handleEdit = (timing) => {
    setTitle(timing.title);
    setDescription(timing.description || '');
    setIsActive(timing.status !== 'Inactive');
    setEditingId(timing.id || timing._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timing?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/medicine-timings/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchTimings();
      }
    } catch (error) {
      console.error('Error deleting timing:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsActive(true);
    setEditingId(null);
  };

  return (
    <div className="medicine-container">
      <div className="medicine-header">
        <h2>Medicine Management</h2>
        <div className="medicine-icon-container">
          <MdMedication size={20} color="white" />
        </div>
      </div>
      <p className="medicine-subtitle">Create Timing</p>

      <form className="medicine-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Morning"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g. Take the medicine in the morning."
            />
          </div>
        </div>

        <div className="toggle-group">
          <label>Active Status</label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={() => setIsActive(!isActive)} 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="submit-btn-container">
          <button type="submit" className="submit-btn">
            {editingId ? 'Update' : 'Submit'}
          </button>
        </div>
      </form>

      <div className="list-section">
        <div className="list-section-header">
          <h3>List</h3>
          <button className="add-new-btn" onClick={resetForm}>+ Add</button>
        </div>

        <div className="table-container">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p>
          ) : (
            <table className="appointments-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Title</th>
                  <th style={{ textAlign: 'left' }}>Description</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {timings.length > 0 ? (
                  timings.map((item) => (
                    <tr key={item.id || item._id}>
                      <td style={{ textAlign: 'left' }}>{item.title}</td>
                      <td style={{ textAlign: 'left' }}>{item.description}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={item.status === 'Inactive' ? 'status-inactive' : 'status-active'}>
                          {item.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="action-icons" style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                          <FaEdit className="edit-icon" onClick={() => handleEdit(item)} />
                          <FaTrash className="delete-icon" onClick={() => handleDelete(item.id || item._id)} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>No timings found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineTime;
