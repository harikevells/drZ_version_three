import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { MdMedication } from "react-icons/md";
import './MedicineManagement.css';
import './PatientAppointments.css';

const MedicineIntake = () => {
  const [intakes, setIntakes] = useState([]);
  const [intakeText, setIntakeText] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntakes();
  }, []);

  const fetchIntakes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/medicine-intakes`);
      if (response.ok) {
        const data = await response.json();
        setIntakes(data);
      }
    } catch (error) {
      console.error('Error fetching intakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!intakeText.trim()) return;

    // Use "intake" as the main field in DB model (or "title" based on plan)
    // The model uses intake or title. We'll send it as intake, but also title just in case.
    const payload = {
      intake: intakeText,
      title: intakeText,
      description,
      status: isActive ? 'Active' : 'Inactive'
    };

    try {
      const url = editingId 
        ? `${API_BASE_URL}/medicine-intakes/${editingId}` 
        : `${API_BASE_URL}/medicine-intakes`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        resetForm();
        fetchIntakes();
      }
    } catch (error) {
      console.error('Error saving intake:', error);
    }
  };

  const handleEdit = (item) => {
    setIntakeText(item.intake || item.title);
    setDescription(item.description || '');
    setIsActive(item.status !== 'Inactive');
    setEditingId(item.id || item._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this intake?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/medicine-intakes/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchIntakes();
      }
    } catch (error) {
      console.error('Error deleting intake:', error);
    }
  };

  const resetForm = () => {
    setIntakeText('');
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
      <p className="medicine-subtitle">Create Intake</p>

      <form className="medicine-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Intake</label>
            <input 
              type="text" 
              value={intakeText} 
              onChange={(e) => setIntakeText(e.target.value)} 
              placeholder="e.g. Before Food"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g. Take medicine before meals."
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
                {intakes.length > 0 ? (
                  intakes.map((item) => (
                    <tr key={item.id || item._id}>
                      <td style={{ textAlign: 'left' }}>{item.intake || item.title}</td>
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
                    <td colSpan="4" style={{ textAlign: 'center' }}>No intakes found.</td>
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

export default MedicineIntake;
