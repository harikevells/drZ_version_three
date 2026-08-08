import React from 'react';
import { FaCapsules, FaBoxOpen, FaExclamationTriangle, FaCalendarTimes, FaCalendarAlt, FaShoppingCart, FaShoppingBag, FaRupeeSign } from 'react-icons/fa';
import './PharmacyStatCards.css';

const PharmacyStatCards = ({ stats, selectedDate, onDateChange }) => {
  // Fallback defaults matching design image if not dynamically passed
  const {
    totalMedicines = 1245,
    availableStock = 8763,
    lowStockAlert = 32,
    expiredMedicines = 18,
    todaysSales = 24850,
    todaysPurchase = 15300,
    todaysProfit = 9550,
    salesGrowth = '+12.5%',
    purchaseGrowth = '+8.3%',
    profitGrowth = '+15.7%'
  } = stats || {};

  return (
    <div className="pharmacy-stats-wrapper">
      {/* Top 4 Stat Cards */}
      <div className="top-stats-grid">
        {/* Card 1: Total Medicines */}
        <div className="top-stat-card">
          <div className="top-card-body">
            <div className="stat-icon-box icon-blue">
              <FaCapsules size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Medicines</span>
              <h2 className="stat-value">{totalMedicines.toLocaleString('en-IN')}</h2>
              <span className="stat-subtext text-blue">All medicines in stock</span>
            </div>
          </div>
        </div>

        {/* Card 2: Available Stock */}
        <div className="top-stat-card">
          <div className="top-card-body">
            <div className="stat-icon-box icon-green">
              <FaBoxOpen size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Available Stock</span>
              <h2 className="stat-value">{availableStock.toLocaleString('en-IN')}</h2>
              <span className="stat-subtext text-green">Total available stock</span>
            </div>
          </div>
        </div>

        {/* Card 3: Low Stock Alert */}
        <div className="top-stat-card">
          <div className="top-card-body">
            <div className="stat-icon-box icon-orange">
              <FaExclamationTriangle size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Low Stock Alert</span>
              <h2 className="stat-value">{lowStockAlert}</h2>
              <span className="stat-subtext text-orange">Medicines low in stock</span>
            </div>
          </div>
        </div>

        {/* Card 4: Expired Medicines + Top Right Date Picker */}
        <div className="top-stat-card relative-card">
          <div className="card-top-action">
            <label className="date-picker-badge">
              <FaCalendarAlt size={13} color="#2563eb" />
              <span>{selectedDate || '06 May 2026'}</span>
              <input 
                type="date" 
                className="date-input-hidden" 
                onChange={(e) => {
                  if (e.target.value && onDateChange) {
                    const d = new Date(e.target.value);
                    const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    onDateChange(formatted);
                  }
                }}
              />
            </label>
          </div>
          <div className="top-card-body">
            <div className="stat-icon-box icon-red">
              <FaCalendarTimes size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Expired Medicines</span>
              <h2 className="stat-value">{expiredMedicines}</h2>
              <span className="stat-subtext text-red">Expired medicines</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle 3 Financial Stat Cards */}
      <div className="middle-stats-grid">
        {/* Card 1: Today's Sales */}
        <div className="financial-stat-card">
          <div className="financial-icon-box icon-cart-green">
            <FaShoppingCart size={22} />
          </div>
          <div className="financial-content">
            <span className="financial-label">Today's Sales</span>
            <h2 className="financial-value">₹ {todaysSales.toLocaleString('en-IN')}</h2>
            <div className="trend-badge trend-green">
              <span>{salesGrowth} vs yesterday ↗</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Purchase */}
        <div className="financial-stat-card">
          <div className="financial-icon-box icon-bag-blue">
            <FaShoppingBag size={22} />
          </div>
          <div className="financial-content">
            <span className="financial-label">Today's Purchase</span>
            <h2 className="financial-value">₹ {todaysPurchase.toLocaleString('en-IN')}</h2>
            <div className="trend-badge trend-blue">
              <span>{purchaseGrowth} vs yesterday ↗</span>
            </div>
          </div>
        </div>

        {/* Card 3: Today's Profit */}
        <div className="financial-stat-card">
          <div className="financial-icon-box icon-purple">
            <FaRupeeSign size={22} />
          </div>
          <div className="financial-content">
            <span className="financial-label">Today's Profit</span>
            <h2 className="financial-value">₹ {todaysProfit.toLocaleString('en-IN')}</h2>
            <div className="trend-badge trend-purple">
              <span>{profitGrowth} vs yesterday ↗</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyStatCards;
