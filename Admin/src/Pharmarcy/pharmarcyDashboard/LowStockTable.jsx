import React, { useState } from 'react';
import { FaCapsules } from 'react-icons/fa';
import './LowStockTable.css';

const LowStockTable = ({ lowStockItems }) => {
  const [showAllModal, setShowAllModal] = useState(false);

  const itemsList = lowStockItems || [];
  const displayItems = itemsList.slice(0, 5);

  return (
    <div className="low-stock-card">
      <div className="table-card-header">
        <h3 className="table-card-title">Low Stock Medicines</h3>
        <button 
          className="view-all-btn" 
          onClick={() => setShowAllModal(true)}
        >
          View All
        </button>
      </div>

      <div className="pharmacy-table-responsive">
        <table className="pharmacy-custom-table">
          <thead>
            <tr>
              <th>Medicine Name</th>
              <th>Brand</th>
              <th>Batch No.</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.length > 0 ? (
              displayItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="med-name-cell">
                      <div className="pill-icon-container">
                        <FaCapsules size={14} className="pill-icon" />
                      </div>
                      <span className="med-title">{item.medicineName}</span>
                    </div>
                  </td>
                  <td className="text-gray">{item.brandName || 'N/A'}</td>
                  <td className="text-gray font-mono">{item.batchNo || item.medicineId || 'N/A'}</td>
                  <td className="stock-warning">{item.stock}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
                  No low stock medicines
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View All Modal */}
      {showAllModal && (
        <div className="pharmacy-modal-overlay">
          <div className="pharmacy-modal-content wide-modal">
            <div className="modal-header">
              <h3>All Low Stock Medicines</h3>
              <button className="close-modal-btn" onClick={() => setShowAllModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <table className="pharmacy-custom-table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Brand</th>
                    <th>Batch No.</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsList.length > 0 ? (
                    itemsList.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="med-name-cell">
                            <div className="pill-icon-container">
                              <FaCapsules size={14} className="pill-icon" />
                            </div>
                            <span className="med-title">{item.medicineName}</span>
                          </div>
                        </td>
                        <td className="text-gray">{item.brandName || 'N/A'}</td>
                        <td className="text-gray font-mono">{item.batchNo || item.medicineId || 'N/A'}</td>
                        <td className="stock-warning">{item.stock}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>
                        No low stock medicines
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LowStockTable;
