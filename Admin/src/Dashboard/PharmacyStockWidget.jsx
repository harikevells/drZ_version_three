import React from 'react';
import { FaCalendarAlt, FaChartLine, FaShoppingCart, FaExclamationTriangle } from 'react-icons/fa';
import './PharmacyStockWidget.css';

const PharmacyStockWidget = ({ stockData }) => {
  const lowStockCount = stockData?.lowStock ?? 23;
  const outOfStockCount = stockData?.outOfStock ?? 11;
  const expiringCount = stockData?.expiringSoon ?? 2;

  // Format count to 2 digits e.g. 02
  const fmt = (num) => String(num).padStart(2, '0');

  return (
    <div className="admin-chart-card pharmacy-stock-card">
      <div className="chart-card-header">
        <div className="card-header-left">
          <FaCalendarAlt className="header-icon" />
          <h3>Pharmacy Stock</h3>
        </div>
      </div>

      <div className="stock-list-body">
        {/* Item 1: Low Stock Medicines */}
        <div className="stock-item">
          <div className="stock-item-left">
            <div className="stock-icon-bg icon-orange-bg">
              <FaChartLine className="stock-icon icon-orange" />
            </div>
            <div className="stock-info">
              <h4 className="stock-title">Low Stock Medicines</h4>
              <p className="stock-desc">Stock running Low</p>
            </div>
          </div>
          <div className="stock-badge">
            {fmt(lowStockCount)}
          </div>
        </div>

        {/* Item 2: Out of Stock */}
        <div className="stock-item">
          <div className="stock-item-left">
            <div className="stock-icon-bg icon-red-bg">
              <FaShoppingCart className="stock-icon icon-red" />
            </div>
            <div className="stock-info">
              <h4 className="stock-title">Out of Stock</h4>
              <p className="stock-desc">Medicine out of stock</p>
            </div>
          </div>
          <div className="stock-badge">
            {fmt(outOfStockCount)}
          </div>
        </div>

        {/* Item 3: Expiring Soon */}
        <div className="stock-item">
          <div className="stock-item-left">
            <div className="stock-icon-bg icon-yellow-bg">
              <FaExclamationTriangle className="stock-icon icon-yellow" />
            </div>
            <div className="stock-info">
              <h4 className="stock-title">Expiring Soon</h4>
              <p className="stock-desc">Within 30days</p>
            </div>
          </div>
          <div className="stock-badge">
            {fmt(expiringCount)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyStockWidget;
