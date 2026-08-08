import React, { useState } from 'react';
import { FaCapsules } from 'react-icons/fa';
import './LowStockTable.css';

const LowStockTable = ({ lowStockItems }) => {
  const [showAllModal, setShowAllModal] = useState(false);

  // Default low stock records fallback matching design image
  const defaultItems = [
    { id: 1, medicineName: 'Crocin 650mg Tablet', brandName: 'Dolo', batchNo: 'BAT-1021', stock: 15 },
    { id: 2, medicineName: 'Azithral 500mg Tablet', brandName: 'Cipla', batchNo: 'BAT-1088', stock: 8 },
    { id: 3, medicineName: 'Amoxicillin 250mg Capsule', brandName: 'Mox', batchNo: 'BAT-2041', stock: 6 },
    { id: 4, medicineName: 'Cetirizine 10mg Tablet', brandName: 'Okacet', batchNo: 'BAT-3092', stock: 12 },
    { id: 5, medicineName: 'Ranitidine 150mg Tablet', brandName: 'Aciloc', batchNo: 'BAT-4015', stock: 10 },
    { id: 6, medicineName: 'Metformin 500mg Tablet', brandName: 'Glycomet', batchNo: 'BAT-5022', stock: 5 },
    { id: 7, medicineName: 'Pantoprazole 40mg Tablet', brandName: 'Pan 40', batchNo: 'BAT-6019', stock: 9 },
  ];

  const itemsList = lowStockItems && lowStockItems.length > 0 ? lowStockItems : defaultItems;
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
            {displayItems.map((item, index) => (
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
            ))}
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
                  {itemsList.map((item, index) => (
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
                  ))}
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
