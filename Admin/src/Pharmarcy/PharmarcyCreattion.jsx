import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import Pagination from '../components/Pagination';
import './Pharmarcy.css';

const PharmarcyCreattion = () => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    role: 'Pharmacy',
    password: '',
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

  const filteredAccounts = accounts.filter(account => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    
    const name = String(account.userName || '').toLowerCase();
    const email = String(account.email || '').toLowerCase();
    const role = String(account.role || '').toLowerCase();
    
    return (
      name.includes(search) || 
      email.includes(search) || 
      role.includes(search)
    );
  });

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchAccounts = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingId) {
        await axios.put(`${API_BASE_URL}/accounts/${editingId}`, formData, config);
      } else {
        await axios.post(`${API_BASE_URL}/accounts`, formData, config);
      }
      
      setFormData({
        userName: '',
        email: '',
        role: 'Pharmacy',
        password: '',
        activeStatus: true
      });
      setEditingId(null);
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (account) => {
    setFormData({
      userName: account.userName,
      email: account.email,
      role: account.role || 'Pharmacy',
      password: '',
      activeStatus: account.activeStatus === 1 || account.activeStatus === true || account.activeStatus === 'true'
    });
    setEditingId(account.id);
    
    // Scroll to top
    const wrapper = document.querySelector('.content-wrapper');
    if (wrapper) {
      wrapper.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        const token = sessionStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/accounts/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchAccounts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Pharmacy, Lab, Scan & Receptionist Management</h1>
      
      <div className="form-card">
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-grid">
            <div className="form-group">
              <label>User Name</label>
              <input 
                type="text" 
                name="userName" 
                placeholder="Enter User Name" 
                value={formData.userName} 
                onChange={handleInputChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} required>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Lab">Lab</option>
                <option value="Scan">Scan</option>
                <option value="Receptionist">Receptionist</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                placeholder="Enter Email" 
                value={formData.email} 
                onChange={handleInputChange} 
                autoComplete="off" 
                required 
              />
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
                    userName: '',
                    email: '',
                    role: 'Pharmacy',
                    password: '',
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
              <th>User Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAccounts.map(account => (
              <tr key={account.id}>
                <td>{account.userName}</td>
                <td>{account.email}</td>
                <td>{account.role}</td>
                <td className={account.activeStatus ? "status-active" : "status-inactive"}>
                  {account.activeStatus ? "Active" : "Inactive"}
                </td>
                <td className="actions-cell">
                  <button className="action-btn" onClick={() => handleEdit(account)}>
                    <FaEdit />
                  </button>
                  <button className="action-btn" onClick={() => handleDelete(account.id)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No accounts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredAccounts.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default PharmarcyCreattion;
