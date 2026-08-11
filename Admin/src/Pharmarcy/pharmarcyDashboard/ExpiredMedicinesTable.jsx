import React, { useState } from 'react';
import { FaCalendarTimes, FaCapsules } from 'react-icons/fa';
import './ExpiredMedicinesTable.css';

const ExpiredMedicinesTable = ({ expiredItems }) => {
  const [showAllModal, setShowAllModal] = useState(false);

  // Default expired items fallback matching realistic data
  const defaultExpired = [
    { id: 1, medicineName: 'Amoxicillin 500mg', medicineId: 'MED-1002', batchNo: 'BAT-9821', stock: 12, expiryDate: '15 Apr 2026' },
    { id: 2, medicineName: 'Ciprofloxacin 250mg', medicineId: 'MED-1045', batchNo: 'BAT-8712', stock: 5, expiryDate: '28 Mar 2026' },
    { id: 3, medicineName: 'Ibuprofen 400mg', medicineId: 'MED-1089', batchNo: 'BAT-7651', stock: 18, expiryDate: '10 Feb 2026' },
    { id: 4, medicineName: 'Omeprazole 20mg', medicineId: 'MED-1102', batchNo: 'BAT-6543', stock: 8, expiryDate: '01 Jan 2026' },
    { id: 5, medicineName: 'Paracetamol 650mg', medicineId: 'MED-1011', batchNo: 'BAT-5432', stock: 25, expiryDate: '20 Dec 2025' },
    { id: 6, medicineName: 'Cetirizine 10mg', medicineId: 'MED-1033', batchNo: 'BAT-4321', stock: 14, expiryDate: '15 Nov 2025' }
  ];

  const expiredList = expiredItems && expiredItems.length > 0 ? expiredItems : defaultExpired;
  const displayItems = expiredList.slice(0, 5);

  return (
    <div className="expired-medicines-card">
      <div className="table-card-header">
        <h3 className="table-card-title">Expired Medicines</h3>
        <button 
          className="view-all-btn text-red-btn" 
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
              <th>Medicine ID</th>
              <th>Qty</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, index) => (
              <tr key={index}>
                <td>
                  <div className="med-name-cell">
                    <div className="expired-icon-container">
                      <FaCapsules size={14} className="expired-pill-icon" />
                    </div>
                    <span className="med-title">{item.medicineName}</span>
                  </div>
                </td>
                <td className="text-gray font-mono">{item.medicineId || 'N/A'}</td>
                <td className="font-semibold text-dark">{item.stock}</td>
                <td className="expiry-date-text">{item.expiryDate}</td>
                <td>
                  <span className="badge-expired">
                    Expired
                  </span>
                </td>
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
              <h3>All Expired Medicines List</h3>
              <button className="close-modal-btn" onClick={() => setShowAllModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <table className="pharmacy-custom-table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Medicine ID</th>
                    <th>Qty</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredList.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="med-name-cell">
                          <div className="expired-icon-container">
                            <FaCapsules size={14} className="expired-pill-icon" />
                          </div>
                          <span className="med-title">{item.medicineName}</span>
                        </div>
                      </td>
                      <td className="text-gray font-mono">{item.medicineId || 'N/A'}</td>
                      <td className="font-semibold text-dark">{item.stock}</td>
                      <td className="expiry-date-text">{item.expiryDate}</td>
                      <td>
                        <span className="badge-expired">
                          Expired
                        </span>
                      </td>
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

export default ExpiredMedicinesTable;
