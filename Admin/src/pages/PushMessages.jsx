import React, { useState, useEffect, useRef } from 'react';
import { FaEnvelope, FaEdit, FaTrashAlt, FaCloudUploadAlt } from 'react-icons/fa';
import './PushMessages.css';

const PushMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsFetching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/medical-camps', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Helper to convert YYYY-MM-DD to DD/MM/YYYY
  const formatDateForAPI = (dateStr) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Helper to convert DD/MM/YYYY to YYYY-MM-DD for input type="date"
  const parseDateForInput = (dateStr) => {
    if (!dateStr || !dateStr.includes('/')) return dateStr;
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !fromDate || !toDate) {
      alert("Please fill all required fields (Title, Description, From Date, To Date).");
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('token');
    
    const formattedFrom = formatDateForAPI(fromDate);
    const formattedTo = formatDateForAPI(toDate);
    const combinedDate = `${formattedFrom} - ${formattedTo}`;
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', combinedDate);
    formData.append('activeStatus', isActive);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const url = editingId 
        ? `http://localhost:5000/api/medical-camps/${editingId}`
        : 'http://localhost:5000/api/medical-camps';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        resetForm();
        fetchMessages();
        alert(`Message ${editingId ? 'updated' : 'created'} successfully!`);
      } else {
        alert("Failed to save message.");
      }
    } catch (error) {
      console.error('Error saving message:', error);
      alert("Error saving message.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (msg) => {
    setEditingId(msg._id);
    setTitle(msg.title || '');
    setDescription(msg.description || '');
    
    if (msg.date && msg.date.includes('-')) {
      const parts = msg.date.split('-');
      setFromDate(parseDateForInput(parts[0].trim()));
      setToDate(parseDateForInput(parts[1].trim()));
    } else {
      setFromDate('');
      setToDate('');
    }
    
    setIsActive(msg.activeStatus !== false);
    setImageFile(null);
    if (msg.image) {
      setImagePreview(`http://localhost:5000${msg.image}`);
    } else {
      setImagePreview(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/medical-camps/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchMessages();
      } else {
        alert("Failed to delete message.");
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setFromDate('');
    setToDate('');
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="push-messages-container">
      <div className="push-messages-header">
        <h2>Push Messages <span className="header-icon"><FaEnvelope /></span></h2>
      </div>

      <div className="push-content-area">
        <div className="push-form-card">
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input 
                type="text" 
                className="form-input" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description..."
              />
            </div>
          </div>

          <div className="form-row form-row-bottom">
            <div className="left-column">
              <div className="form-group">
                <label>Date</label>
                <div className="date-inputs">
                  <input 
                    type="date" 
                    className="form-input" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                  <input 
                    type="date" 
                    className="form-input" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group status-group">
                <label>Active Status</label>
                <div className={`toggle-switch ${isActive ? 'active' : ''}`} onClick={() => setIsActive(!isActive)}>
                  <div className="toggle-circle"></div>
                </div>
              </div>
            </div>
            
            <div className="right-column">
              <div className="form-group">
                <label>Image Upload</label>
                <div className="upload-box" onClick={handleFileClick} style={{cursor: 'pointer', position: 'relative', overflow: 'hidden'}}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0}} />
                  ) : (
                    <>
                      <div className="upload-icon-container">
                        <FaCloudUploadAlt className="upload-icon" />
                      </div>
                      <p className="upload-text">Click the button below to<br/>upload your files.</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{display: 'none'}} 
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  <button type="button" className="choose-file-btn" onClick={(e) => { e.stopPropagation(); handleFileClick(); }} style={{position: 'relative', zIndex: 10, marginTop: imagePreview ? '100px' : '0'}}>
                    {imagePreview ? 'Change Image' : 'Choose File'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="submit-btn-container">
            {editingId && (
              <button type="button" className="submit-btn" style={{backgroundColor: '#6b7280', marginRight: '10px'}} onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="button" className="submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Processing...' : (editingId ? 'Update Message' : 'Submit')}
            </button>
          </div>
        </div>

        <div className="push-list-card">
          <div className="list-header">
            <h3>List</h3>
          </div>
          
          <div className="push-table-container">
            {isFetching ? (
              <p style={{textAlign: 'center', padding: '20px'}}>Loading messages...</p>
            ) : (
              <table className="push-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length > 0 ? messages.map((msg) => (
                    <tr key={msg._id}>
                      <td>
                        {msg.image ? (
                          <img src={`http://localhost:5000${msg.image}`} alt="camp" style={{width: '50px', height: '40px', borderRadius: '4px', objectFit: 'cover'}} />
                        ) : (
                          <div style={{width: '50px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px'}}>N/A</div>
                        )}
                      </td>
                      <td className="title-cell">{msg.title}</td>
                      <td className="desc-cell">{msg.description}</td>
                      <td>{msg.date}</td>
                      <td className={`status-cell ${msg.activeStatus !== false ? 'active' : 'inactive'}`}>
                        {msg.activeStatus !== false ? 'Active' : 'Inactive'}
                      </td>
                      <td className="action-cell">
                        <div className="action-buttons">
                          <button className="table-action-btn edit-btn" onClick={() => handleEdit(msg)}><FaEdit /></button>
                          <button className="table-action-btn delete-btn" onClick={() => handleDelete(msg._id)}><FaTrashAlt /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No messages found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushMessages;
