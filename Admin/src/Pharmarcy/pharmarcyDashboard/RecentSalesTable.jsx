import React, { useState } from 'react';
import './RecentSalesTable.css';

const RecentSalesTable = ({ salesData }) => {
  const [showAllModal, setShowAllModal] = useState(false);

  // Default sales records matching design image
  const defaultSales = [
    { invoiceNo: 'INV-10085', customerName: 'Ramesh Kumar', items: 3, amount: 1250, paymentMode: 'Cash', time: '11:30 AM' },
    { invoiceNo: 'INV-10084', customerName: 'Priya Sharma', items: 5, amount: 2480, paymentMode: 'UPI', time: '10:45 AM' },
    { invoiceNo: 'INV-10083', customerName: 'Suresh Patel', items: 2, amount: 680, paymentMode: 'Card', time: '10:15 AM' },
    { invoiceNo: 'INV-10082', customerName: 'Anita Desai', items: 4, amount: 1760, paymentMode: 'Cash', time: '09:40 AM' },
    { invoiceNo: 'INV-10081', customerName: 'Vikram Singh', items: 6, amount: 3240, paymentMode: 'UPI', time: '09:10 AM' },
    { invoiceNo: 'INV-10080', customerName: 'Rajesh Verma', items: 1, amount: 450, paymentMode: 'Cash', time: '08:50 AM' },
    { invoiceNo: 'INV-10079', customerName: 'Kavita Nair', items: 4, amount: 2100, paymentMode: 'Card', time: '08:20 AM' },
  ];

  const salesList = salesData && salesData.length > 0 ? salesData : defaultSales;
  const displaySales = salesList.slice(0, 5);

  const getBadgeClass = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'cash':
        return 'badge-cash';
      case 'upi':
        return 'badge-upi';
      case 'card':
        return 'badge-card';
      default:
        return 'badge-default';
    }
  };

  return (
    <div className="recent-sales-card">
      <div className="table-card-header">
        <h3 className="table-card-title">Recent Sales</h3>
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
              <th>Invoice No.</th>
              <th>Customer Name</th>
              <th>Items</th>
              <th>Amount (₹)</th>
              <th>Payment Mode</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {displaySales.map((sale, index) => (
              <tr key={index}>
                <td className="font-semibold text-dark">{sale.invoiceNo}</td>
                <td>{sale.customerName}</td>
                <td>{sale.items}</td>
                <td className="font-semibold">{sale.amount.toLocaleString('en-IN')}</td>
                <td>
                  <span className={`payment-badge ${getBadgeClass(sale.paymentMode)}`}>
                    {sale.paymentMode}
                  </span>
                </td>
                <td className="text-gray">{sale.time}</td>
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
              <h3>All Recent Sales Transactions</h3>
              <button className="close-modal-btn" onClick={() => setShowAllModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <table className="pharmacy-custom-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Customer Name</th>
                    <th>Items</th>
                    <th>Amount (₹)</th>
                    <th>Payment Mode</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {salesList.map((sale, index) => (
                    <tr key={index}>
                      <td className="font-semibold text-dark">{sale.invoiceNo}</td>
                      <td>{sale.customerName}</td>
                      <td>{sale.items}</td>
                      <td className="font-semibold">{sale.amount.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`payment-badge ${getBadgeClass(sale.paymentMode)}`}>
                          {sale.paymentMode}
                        </span>
                      </td>
                      <td className="text-gray">{sale.time}</td>
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

export default RecentSalesTable;
