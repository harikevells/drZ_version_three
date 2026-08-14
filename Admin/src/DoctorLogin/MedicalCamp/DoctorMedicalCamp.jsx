import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaList, FaEdit, FaTrash, FaImage, FaCampground } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import './DoctorMedicalCamp.css';

const DoctorMedicalCamp = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState(null);

  // Form State
  const [campId, setCampId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeStatus, setActiveStatus] = useState(true);
  const [image, setImage] = useState(''); // Base64 string for simplicity

  useEffect(() => {
    const storedData = sessionStorage.getItem('doctorData');
    if (storedData) {
      setDoctorData(JSON.parse(storedData));
    }
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/push-notifications`);
      setCamps(res.data);
    } catch (error) {
      console.error('Error fetching medical camps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setCampId(null);
    setTitle('');
    setDescription('');
    setFromDate('');
    setToDate('');
    setActiveStatus(true);
    setImage('');
    setViewMode('list');
  };

  const handleEdit = (camp) => {
    setCampId(camp._id || camp.id);
    setTitle(camp.title);
    setDescription(camp.description);
    
    // Convert DD/MM/YYYY to YYYY-MM-DD for input[type="date"]
    const formatForInput = (dStr) => {
      if(!dStr) return '';
      const parts = dStr.split('/');
      if(parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return dStr;
    };

    setFromDate(formatForInput(camp.fromDate));
    setToDate(formatForInput(camp.toDate));
    setActiveStatus(camp.activeStatus);
    setImage(camp.image || '');
    setViewMode('create');
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this Medical Camp?")) {
      try {
        await axios.delete(`${API_BASE_URL}/push-notifications/${id}`);
        fetchCamps();
      } catch(e) {
        alert("Failed to delete camp.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !fromDate || !toDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Convert YYYY-MM-DD to DD/MM/YYYY
    const formatForApi = (dStr) => {
      if(!dStr) return '';
      const parts = dStr.split('-');
      if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return dStr;
    };

    const payload = {
      title,
      description,
      fromDate: formatForApi(fromDate),
      toDate: formatForApi(toDate),
      activeStatus,
      image,
      role: 'doctor',
      doctorName: doctorData?.doctorName || 'Doctor'
    };

    try {
      if (campId) {
        await axios.put(`${API_BASE_URL}/push-notifications/${campId}`, payload);
        alert('Medical camp updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/push-notifications`, payload);
        alert('Medical camp created successfully');
      }
      resetForm();
      fetchCamps();
    } catch (error) {
      console.error('Error saving medical camp:', error);
      alert('Failed to save medical camp');
    }
  };

  return (
    <div className="doc-camp-container">
        
        {/* Toggle Bar */}
        <div className="doc-camp-toggle">
          <button 
            className={`doc-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <FaList /> View All Camps
          </button>
          <button 
            className={`doc-toggle-btn ${viewMode === 'create' ? 'active' : ''}`}
            onClick={() => { resetForm(); setViewMode('create'); }}
          >
            <FaPlus /> Create New
          </button>
        </div>

        {viewMode === 'list' ? (
          <div className="doc-camp-list-view">
            {loading ? (
              <div className="doc-camp-empty">Loading camps...</div>
            ) : camps.length === 0 ? (
              <div className="doc-camp-empty">
                <FaCampground size={48} color="#CBD5E1" style={{marginBottom: '10px'}} />
                <p>No medical camps found.</p>
              </div>
            ) : (
              <div className="doc-camp-grid">
                {camps.map(camp => (
                  <div key={camp._id || camp.id} className="doc-camp-card">
                    {camp.image ? (
                      <div className="doc-camp-img" style={{backgroundImage: `url(${camp.image})`}}></div>
                    ) : (
                      <div className="doc-camp-img-placeholder">
                        <FaCampground size={30} color="#94A3B8" />
                      </div>
                    )}
                    
                    <div className="doc-camp-content">
                      <div className="doc-camp-header">
                        <h4>{camp.title}</h4>
                        <span className={`doc-camp-status ${camp.activeStatus ? 'active' : 'inactive'}`}>
                          {camp.activeStatus ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="doc-camp-dates">{camp.fromDate} to {camp.toDate}</p>
                      <p className="doc-camp-desc">{camp.description}</p>
                      
                      <p className="doc-camp-creator">
                        Created by: {camp.role === 'admin' ? 'Admin' : (camp.doctorName || 'Doctor')}
                      </p>

                      {camp.role === 'doctor' && camp.doctorName === doctorData?.doctorName && (
                        <div className="doc-camp-actions">
                          <button className="doc-camp-action-btn edit" onClick={() => handleEdit(camp)}>
                            <FaEdit /> Edit
                          </button>
                          <button className="doc-camp-action-btn delete" onClick={() => handleDelete(camp._id || camp.id)}>
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="doc-camp-form-view">
            <div className="doc-camp-form-card">
              <h3>{campId ? 'Edit Medical Camp' : 'Create New Medical Camp'}</h3>
              
              <form onSubmit={handleSubmit} className="doc-camp-form">
                <div className="doc-form-group">
                  <label>Title</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Enter camp title"
                    required 
                  />
                </div>

                <div className="doc-form-row">
                  <div className="doc-form-group">
                    <label>From Date</label>
                    <input 
                      type="date" 
                      value={fromDate} 
                      onChange={e => setFromDate(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="doc-form-group">
                    <label>To Date</label>
                    <input 
                      type="date" 
                      value={toDate} 
                      onChange={e => setToDate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="doc-form-group">
                  <label>Description</label>
                  <textarea 
                    rows="4" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Enter camp details..."
                    required 
                  />
                </div>

                <div className="doc-form-group">
                  <label>Camp Image</label>
                  <div className="doc-image-upload">
                    {image ? (
                      <div className="doc-image-preview">
                        <img src={image} alt="Preview" />
                        <button type="button" onClick={() => setImage('')}>Remove</button>
                      </div>
                    ) : (
                      <label className="doc-upload-label">
                        <FaImage size={24} color="#64748B" />
                        <span>Click to upload image</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="doc-form-group checkbox">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={activeStatus} 
                      onChange={e => setActiveStatus(e.target.checked)} 
                    />
                    Active Status
                  </label>
                </div>

                <div className="doc-form-actions">
                  <button type="button" className="doc-btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="doc-btn-primary">
                    {campId ? 'Update Camp' : 'Create Camp'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default DoctorMedicalCamp;
