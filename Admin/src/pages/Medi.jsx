import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_LOCAL_URL } from '../config';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import Pagination from '../components/Pagination';
import './DoctorManagement.css'; // Importing DoctorManagement CSS to match exact design
import './Medi.css';

const Medi = () => {
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    medicineName: '', brandName: '', medicineId: '',
    category: '', medicineType: '', manufacturer: '',
    purchasePrice: '', sellingPrice: '', currentStock: '', minimumStock: '',
    mfgDate: '', expiryDate: '', activeStatus: true, description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(`${API_LOCAL_URL}/medicines`);
      setMedicines(response.data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleReset = () => {
    setFormData({
      medicineName: '', brandName: '', medicineId: '',
      category: '', medicineType: '', manufacturer: '',
      purchasePrice: '', sellingPrice: '', currentStock: '', minimumStock: '',
      mfgDate: '', expiryDate: '', activeStatus: true, description: ''
    });
    setEditingId(null);
    setIsFormVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_LOCAL_URL}/medicines/${editingId}`, formData);
        alert('Medicine updated successfully!');
      } else {
        await axios.post(`${API_LOCAL_URL}/medicines`, formData);
        alert('Medicine created successfully!');
      }
      fetchMedicines();
      handleReset();
    } catch (err) {
      console.error('Error saving medicine:', err);
      alert('Error saving medicine');
    }
  };

  const handleEdit = (med) => {
    setFormData({ ...med });
    setEditingId(med._id || med.id);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await axios.delete(`${API_LOCAL_URL}/medicines/${id}`);
        fetchMedicines();
      } catch (err) {
        console.error('Error deleting medicine:', err);
      }
    }
  };

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.medicineId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All Categories' || med.category === filterCategory;
    const matchesStatus = filterStatus === 'All Status' || 
                          (filterStatus === 'Active' ? med.activeStatus : !med.activeStatus);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const paginatedMedicines = filteredMedicines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStockStatus = (current, min) => {
    const curr = parseInt(current) || 0;
    const minimum = parseInt(min) || 0;
    if (curr === 0) return { label: 'Out of Stock', color: 'red' };
    if (curr <= minimum) return { label: 'Low Stock', color: 'orange' };
    return { label: curr.toString(), color: 'green' };
  };

  // Extract unique categories for filter
  const categories = ['All Categories', ...new Set(medicines.map(m => m.category).filter(Boolean))];

  return (
    <div className="page-container">
      {isFormVisible ? (
        <>
          <h1 className="page-title">{editingId ? 'Edit Medicine' : 'Create Medicine'}</h1>

          <div className="form-card">
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-grid">
                <div className="form-group">
                  <label>Medicine Name</label>
                  <input type="text" name="medicineName" value={formData.medicineName} onChange={handleInputChange} required placeholder="e.g. Paracetamol 500mg" />
                </div>
                <div className="form-group">
                  <label>Brand Name</label>
                  <input type="text" name="brandName" value={formData.brandName} onChange={handleInputChange} required placeholder="e.g. Dolo 500" />
                </div>
                <div className="form-group">
                  <label>Medicine ID</label>
                  <input type="text" name="medicineId" value={formData.medicineId} onChange={handleInputChange} required placeholder="e.g. MED-00123" />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required className="dr-management-select">
                    <option value="">Select Category</option>
                    <option value="Analgesic">Analgesic</option>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Antihistamine">Antihistamine</option>
                    <option value="Antacid">Antacid</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Medicine Type</label>
                  <select name="medicineType" value={formData.medicineType} onChange={handleInputChange} required className="dr-management-select">
                    <option value="">Select Type</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Manufacturer</label>
                  <select name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} required className="dr-management-select">
                    <option value="">Select Manufacturer</option>
                    <option value="Micro Labs Limited">Micro Labs Limited</option>
                    <option value="Cipla Limited">Cipla Limited</option>
                    <option value="Dr. Reddy's">Dr. Reddy's</option>
                    <option value="Sun Pharma">Sun Pharma</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Purchase Price (₹)</label>
                  <input type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange} required placeholder="0.00" className="dr-management-input" />
                </div>
                <div className="form-group">
                  <label>Selling Price (₹)</label>
                  <input type="number" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleInputChange} required placeholder="0.00" className="dr-management-input" />
                </div>
                <div className="form-group">
                  <label>Current Stock</label>
                  <input type="number" name="currentStock" value={formData.currentStock} onChange={handleInputChange} required placeholder="0" className="dr-management-input" />
                </div>
                
                <div className="form-group">
                  <label>Minimum Stock</label>
                  <input type="number" name="minimumStock" value={formData.minimumStock} onChange={handleInputChange} required placeholder="0" className="dr-management-input" />
                </div>
                <div className="form-group">
                  <label>Mfg. Date</label>
                  <input type="date" name="mfgDate" value={formData.mfgDate} onChange={handleInputChange} required className="dr-management-input" />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} required className="dr-management-input" />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Relieves pain and reduces fever." className="dr-management-input" />
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
                <button type="button" className="submit-btn" style={{marginLeft: '10px', backgroundColor: '#e5e7eb', color: 'black'}} onClick={handleReset}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      ) : (
        <>
          <h1 className="page-title">Medicine Management</h1>
          
          <div className="list-header" style={{ display: 'flex', justifyItems: 'flex-start', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            {/* <h2 className="list-title">List:</h2> */}
            <input 
              type="text" 
              placeholder="Search medicine..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', width: '250px', outline: 'none' }}
            />
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button className="add-btn" style={{ marginLeft: 'auto' }} onClick={() => { handleReset(); setIsFormVisible(true); }}>
               Add Medicine
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine ID</th>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Manufacturer</th>
                  <th>Stock</th>
                  <th>Price (₹)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMedicines.length > 0 ? (
                  paginatedMedicines.map(med => {
                    const stockStatus = getStockStatus(med.currentStock, med.minimumStock);
                    return (
                      <tr key={med._id || med.id}>
                        <td>{med.medicineId}</td>
                        <td>{med.medicineName}</td>
                        <td>{med.category}</td>
                        <td>{med.brandName}</td>
                        <td>{med.manufacturer}</td>
                        <td className={`stock-${stockStatus.color}`} style={{fontWeight: 600, color: stockStatus.color}}>{stockStatus.label}</td>
                        <td>{parseFloat(med.sellingPrice).toFixed(2)}</td>
                        <td className={med.activeStatus ? 'status-active' : 'status-inactive'}>
                          {med.activeStatus ? 'Active' : 'Inactive'}
                        </td>
                        <td className="actions-cell">
                          <button className="action-btn" onClick={() => handleEdit(med)}><FaEdit /></button>
                          <button className="action-btn" onClick={() => handleDelete(med._id || med.id)}><FaTrash /></button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{textAlign: 'center', padding: '20px'}}>No medicines found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredMedicines.length > 0 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredMedicines.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Medi;
