import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_LOCAL_URL } from '../config';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaArrowLeft, FaEye, FaTint, FaCapsules, FaBoxOpen, FaExclamationTriangle, FaCalendarTimes, FaShoppingCart, FaTimesCircle } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Pagination from '../components/Pagination';
import './DoctorManagement.css'; // Importing DoctorManagement CSS to match exact design
import './Medi.css';
import '../Pharmarcy/pharmarcyDashboard/PharmacyStatCards.css';

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
  const [viewingMed, setViewingMed] = useState(null);
  const fileInputRef = useRef(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [statsData, setStatsData] = useState({
    totalMedicines: 0,
    availableStock: 0,
    lowStockAlert: 0,
    outOfStock: 0,
    expiredMedicines: 0,
    totalMedicineSales: 0
  });
  const userRole = sessionStorage.getItem('role');

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/medicines`);
      const meds = response.data;
      setMedicines(meds);

      if (sessionStorage.getItem('role') === 'Admin') {
        let totalMeds = meds.length;
        let totalStockCount = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let expiredCount = 0;
        const today = new Date();

        meds.forEach(med => {
          const stock = parseInt(med.currentStock, 10) || 0;
          const minStock = parseInt(med.minimumStock, 10) || 10;
          totalStockCount += stock;

          const expDate = med.expiryDate ? new Date(med.expiryDate) : null;
          if (expDate && !isNaN(expDate.getTime()) && expDate < today) {
            expiredCount++;
          }
          if (stock === 0) {
            outOfStockCount++;
          } else if (stock <= minStock && stock > 0) {
            lowStockCount++;
          }
        });

        // Fetch billings for total sales
        const billingsRes = await axios.get(`${API_BASE_URL}/billings`).catch(() => ({ data: [] }));
        const billings = Array.isArray(billingsRes.data) ? billingsRes.data : [];

        let totalMedicineAmount = 0;
        billings.forEach(bill => {
          const totalPayable = parseFloat(bill.totalPayable || 0);
          const consultFee = parseFloat(bill.consultFee || 0);
          const medicineAmt = bill.totalMedicineAmount != null
            ? parseFloat(bill.totalMedicineAmount)
            : Math.max(0, totalPayable - consultFee);
          totalMedicineAmount += medicineAmt;
        });

        setStatsData({
          totalMedicines: totalMeds,
          availableStock: totalStockCount,
          lowStockAlert: lowStockCount,
          outOfStock: outOfStockCount,
          expiredMedicines: expiredCount,
          totalMedicineSales: totalMedicineAmount
        });
      }
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
        await axios.put(`${API_BASE_URL}/medicines/${editingId}`, formData);
        alert('Medicine updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/medicines`, formData);
        alert('Medicine created successfully!');
      }
      fetchMedicines();
      handleReset();
    } catch (err) {
      console.error('Error saving medicine:', err);
      alert('Error saving medicine');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      try {
        const promises = jsonData.map(item => {
          const mappedData = {
            medicineName: item['Medicine Name'] || item.medicineName || '',
            brandName: item['Brand Name'] || item.brandName || '',
            medicineId: item['Medicine ID'] || item.medicineId || '',
            category: item['Category'] || item.category || '',
            medicineType: item['Medicine Type'] || item.medicineType || '',
            manufacturer: item['Manufacturer'] || item.manufacturer || '',
            purchasePrice: item['Purchase Price'] || item['Purchase Price (₹)'] || item.purchasePrice || '',
            sellingPrice: item['Selling Price'] || item['Selling Price (₹)'] || item.sellingPrice || '',
            currentStock: item['Current Stock'] || item.currentStock || '',
            minimumStock: item['Minimum Stock'] || item.minimumStock || '',
            mfgDate: item['Mfg. Date'] || item.mfgDate || '',
            expiryDate: item['Expiry Date'] || item.expiryDate || '',
            description: item['Description'] || item.description || '',
            activeStatus: item['Active Status'] !== undefined ? item['Active Status'] : true,
          };
          return axios.post(`${API_BASE_URL}/medicines`, mappedData);
        });

        await Promise.all(promises);
        alert('Bulk upload successful!');
        fetchMedicines();
      } catch (err) {
        console.error('Error during bulk upload:', err);
        alert('Error during bulk upload');
      }
      
      e.target.value = null;
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEdit = (med) => {
    const formatDate = (dateValue) => {
      if (!dateValue) return '';
      try {
        if (!isNaN(dateValue) && Number(dateValue) > 20000) {
          const d = new Date((Number(dateValue) - 25569) * 86400 * 1000);
          return d.toISOString().split('T')[0];
        }

        let dateString = String(dateValue).trim();
        if (dateString.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)) {
           const parts = dateString.split(/[\/\-]/);
           dateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else if (dateString.match(/^\d{4}[\/\-]\d{2}[\/\-]\d{2}T/)) {
           return dateString.split('T')[0];
        }

        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
      } catch (e) {
        return '';
      }
    };

    setFormData({
      medicineName: med.medicineName || '',
      brandName: med.brandName || '',
      medicineId: med.medicineId || '',
      category: med.category || '',
      medicineType: med.medicineType || '',
      manufacturer: med.manufacturer || '',
      purchasePrice: med.purchasePrice || '',
      sellingPrice: med.sellingPrice || '',
      currentStock: med.currentStock || '',
      minimumStock: med.minimumStock || '',
      description: med.description || '',
      activeStatus: med.activeStatus !== undefined ? med.activeStatus : true,
      mfgDate: formatDate(med.mfgDate),
      expiryDate: formatDate(med.expiryDate)
    });
    setEditingId(med._id || med.id);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await axios.delete(`${API_BASE_URL}/medicines/${id}`);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                type="button" 
                onClick={handleReset} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, marginTop: '-11px' }}
                title="Go Back"
              >
                <FaArrowLeft />
              </button>
              <h1 className="page-title" style={{ margin: 0, lineHeight: 1, display: 'flex', alignItems: 'center', marginBottom: '0px' }}>{editingId ? 'Edit Medicine' : 'Create Medicine'}</h1>
            </div>
            {!editingId && (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".xlsx, .xls" 
                  onChange={handleFileUpload} 
                />
                <button type="button" className="add-btn" style={{ backgroundColor: '#10b981',color:'white' }} onClick={() => fileInputRef.current.click()}>
                   Bulk Upload
                </button>
              </div>
            )}
          </div>

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
          <h1 style={{marginBottom:'20px'}} className="page-title">Medicine Management</h1>
          
          {userRole === 'Admin' && (
            <div className="pharmacy-stats-wrapper" style={{ marginBottom: '20px' }}>
              <div className="top-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="top-stat-card">
                  <div className="top-card-body">
                    <div className="stat-icon-box icon-blue"><FaCapsules size={24} /></div>
                    <div className="stat-content">
                      <span className="stat-label">Total Medicines</span>
                      <h2 className="stat-value">{statsData.totalMedicines.toLocaleString('en-IN')}</h2>
                      <span className="stat-subtext text-blue">All medicines in stock</span>
                    </div>
                  </div>
                </div>

                <div className="top-stat-card">
                  <div className="top-card-body">
                    <div className="stat-icon-box icon-green"><FaBoxOpen size={24} /></div>
                    <div className="stat-content">
                      <span className="stat-label">Available Stock</span>
                      <h2 className="stat-value">{statsData.availableStock.toLocaleString('en-IN')}</h2>
                      <span className="stat-subtext text-green">Total available stock</span>
                    </div>
                  </div>
                </div>

                <div className="top-stat-card">
                  <div className="top-card-body">
                    <div className="stat-icon-box icon-orange"><FaExclamationTriangle size={22} /></div>
                    <div className="stat-content">
                      <span className="stat-label">Low Stock Alert</span>
                      <h2 className="stat-value">{statsData.lowStockAlert}</h2>
                      <span className="stat-subtext text-orange">Medicines low in stock</span>
                    </div>
                  </div>
                </div>

                <div className="top-stat-card">
                  <div className="top-card-body">
                    <div className="stat-icon-box icon-red"><FaCalendarTimes size={24} /></div>
                    <div className="stat-content">
                      <span className="stat-label">Expired Medicines</span>
                      <h2 className="stat-value">{statsData.expiredMedicines}</h2>
                      <span className="stat-subtext text-red">Expired medicines</span>
                    </div>
                  </div>
                </div>
                
                <div className="top-stat-card">
                  <div className="top-card-body">
                    <div className="stat-icon-box" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}><FaTimesCircle size={22} color="#dc2626" /></div>
                    <div className="stat-content">
                      <span className="stat-label">Out of Stock</span>
                      <h2 className="stat-value" style={{ color: statsData.outOfStock > 0 ? '#dc2626' : '#15803d' }}>{statsData.outOfStock}</h2>
                      <span className="stat-subtext" style={{ color: statsData.outOfStock > 0 ? '#dc2626' : '#15803d' }}>Medicines out of stock</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  <th>Stock</th>
                  <th>Price (₹)</th>
                  <th>Status</th>
                  <th style={{textAlign: 'center'}}>View</th>
                  <th style={{textAlign: 'center'}}>Action</th>
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
                        <td style={{ fontWeight: 600, color: stockStatus.color, textAlign: 'center' }}>{stockStatus.label}</td>
                        <td>{parseFloat(med.sellingPrice).toFixed(2)}</td>
                        <td className={med.activeStatus ? 'status-active' : 'status-inactive'}>
                          {med.activeStatus ? 'Active' : 'Inactive'}
                        </td>
                        <td style={{textAlign: 'center'}}>
                          <button className="action-btn" title="View Details" onClick={() => setViewingMed(med)}><FaEye /></button>
                        </td>
                        <td style={{textAlign: 'center', verticalAlign: 'middle'}}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button className="action-btn" title="Edit" onClick={() => handleEdit(med)}><FaEdit /></button>
                            <button className="action-btn" title="Delete" onClick={() => handleDelete(med._id || med.id)}><FaTrash /></button>
                          </div>
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

      {/* View Modal */}
      {viewingMed && (
        <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div className="modal-content" style={{backgroundColor: '#ffffff', borderRadius: '12px', width: '750px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif'}}>
            
            {/* Header */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e5e7eb'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%'}}></span>
                <span style={{fontSize: '12px', fontWeight: '600', color: '#6b7280', letterSpacing: '0.05em'}}>ACTIVE RECORD</span>
              </div>
              <button onClick={() => setViewingMed(null)} style={{background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151', fontSize: '18px'}}>&times;</button>
            </div>

            {/* Body */}
            <div style={{display: 'flex', flex: 1}}>
              
              {/* Left Panel */}
              <div style={{width: '35%', padding: '24px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column'}}>
                <div style={{width: '48px', height: '48px', backgroundColor: '#fcfcfc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid #e5e7eb'}}>
                  <FaTint style={{color: '#d97706', fontSize: '20px'}} />
                </div>
                <h2 style={{margin: '0 0 4px 0', fontSize: '20px', color: '#111827', fontWeight: '600'}}>{viewingMed.medicineName}</h2>
                <span style={{fontSize: '13px', color: '#6b7280', marginBottom: '32px'}}>{viewingMed.medicineId}</span>

                <div style={{marginBottom: '20px'}}>
                  <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Stock</div>
                  <div style={{fontSize: '24px', color: '#111827', fontWeight: '600'}}>{viewingMed.currentStock}</div>
                </div>

                <div>
                  <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Price</div>
                  <div style={{fontSize: '24px', color: '#111827', fontWeight: '600'}}>₹{parseFloat(viewingMed.sellingPrice || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Right Panel */}
              <div style={{width: '65%', padding: '20px 20px', display: 'flex', flexDirection: 'column'}}>
                
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  {[
                    { label: 'Brand', value: viewingMed.brandName },
                    { label: 'Category', value: viewingMed.category },
                    { label: 'Type', value: viewingMed.medicineType },
                    { label: 'Manufacturer', value: viewingMed.manufacturer },
                    { label: 'Purchase price', value: `₹${parseFloat(viewingMed.purchasePrice || 0).toFixed(2)}` },
                    { label: 'Selling price', value: `₹${parseFloat(viewingMed.sellingPrice || 0).toFixed(2)}` },
                    { label: 'Minimum stock', value: viewingMed.minimumStock },
                    { label: 'Mfg date', value: viewingMed.mfgDate ? (isNaN(new Date(viewingMed.mfgDate).getTime()) ? viewingMed.mfgDate : new Date(viewingMed.mfgDate).toLocaleDateString()) : 'N/A' },
                    { label: 'Expiry date', value: viewingMed.expiryDate ? (isNaN(new Date(viewingMed.expiryDate).getTime()) ? viewingMed.expiryDate : new Date(viewingMed.expiryDate).toLocaleDateString()) : 'Invalid date', color: !viewingMed.expiryDate ? '#dc2626' : '#111827' }
                  ].map((row, i) => (
                    <div key={i} style={{display: 'flex', padding: '12px 0', borderBottom: '1px solid #e5e7eb'}}>
                      <span style={{width: '40%', color: '#6b7280', fontSize: '14px'}}>{row.label}</span>
                      <span style={{width: '60%', color: row.color || '#111827', fontSize: '14px', fontWeight: '500'}}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{marginTop: '10px'}}>
                  <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '8px'}}>Description</div>
                  <div style={{fontSize: '14px', color: '#111827', fontWeight: '500', lineHeight: '1.5'}}>{viewingMed.description || 'No description available.'}</div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div style={{padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
              <button style={{padding: '8px 24px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#111827', fontWeight: '500', cursor: 'pointer', fontSize: '14px'}} onClick={() => setViewingMed(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medi;
