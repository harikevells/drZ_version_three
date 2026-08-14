import React, { useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import './RevenueOverviewChart.css';

const RevenueOverviewChart = ({ revenueData, onYearChange }) => {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());

  const months = revenueData?.months || [
    { month: 'Jan', consultation: 0, pharmacy: 0 },
    { month: 'Feb', consultation: 0, pharmacy: 0 },
    { month: 'Mar', consultation: 0, pharmacy: 0 },
    { month: 'Apr', consultation: 0, pharmacy: 0 },
    { month: 'May', consultation: 0, pharmacy: 0 },
    { month: 'Jun', consultation: 0, pharmacy: 0 },
    { month: 'Jul', consultation: 0, pharmacy: 0 },
    { month: 'Aug', consultation: 0, pharmacy: 0 },
    { month: 'Sep', consultation: 0, pharmacy: 0 },
    { month: 'Oct', consultation: 0, pharmacy: 0 },
    { month: 'Nov', consultation: 0, pharmacy: 0 },
    { month: 'Dec', consultation: 0, pharmacy: 0 }
  ];

  const currencySymbol = revenueData?.currency ?? '₹';

  // Strictly dynamic annual sum calculated from real month values
  const totalAmount = months.reduce((acc, m) => acc + (m.consultation || 0) + (m.pharmacy || 0), 0);

  // Maximum value for dynamic scaling Y-axis
  const maxRevenue = Math.max(...months.map(m => Math.max(m.consultation || 0, m.pharmacy || 0)), 100);
  const maxVal = Math.ceil(maxRevenue / 100) * 100 || 1000;

  const handleYearSelect = (e) => {
    const yr = e.target.value;
    setSelectedYear(yr);
    if (onYearChange) {
      onYearChange(yr);
    }
  };

  const tickTop = maxVal >= 1000 ? `${Math.round(maxVal / 1000)}k` : `${maxVal}`;
  const tickMid = maxVal >= 1000 ? `${Math.round((maxVal * 0.6) / 1000)}k` : `${Math.round(maxVal * 0.6)}`;
  const tickLow = maxVal >= 1000 ? `${Math.round((maxVal * 0.2) / 1000)}k` : `${Math.round(maxVal * 0.2)}`;

  return (
    <div className="admin-chart-card revenue-overview-card">
      {/* Header with Title and Year Filter */}
      <div className="chart-card-header">
        <div className="card-header-left">
          <FaCalendarAlt className="header-icon" />
          <h3>Revenue Overview</h3>
        </div>
        <div className="year-filter-box">
          <select value={selectedYear} onChange={handleYearSelect} className="year-select-dropdown">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="revenue-legend-bar">
        <div className="legend-item-inline">
          <span className="dot dot-blue"></span>
          <span className="legend-text">Consultation Revenue</span>
        </div>
        <div className="legend-item-inline">
          <span className="dot dot-peach"></span>
          <span className="legend-text">Pharmacy Revenue</span>
        </div>
      </div>

      {/* Dynamic Dual Bar Chart Body */}
      <div className="revenue-chart-body">
        {/* Y Axis Grid labels */}
        <div className="y-axis-container">
          <div className="y-label">{tickTop}</div>
          <div className="y-label">{tickMid}</div>
          <div className="y-label">{tickLow}</div>
        </div>

        {/* Bars Group Container */}
        <div className="bars-group-container">
          <div className="grid-line line-5k"></div>
          <div className="grid-line line-3k"></div>
          <div className="grid-line line-1k"></div>

          <div className="bars-flex flex-row">
            {months.map((item, idx) => {
              const consultHeight = maxVal > 0 ? Math.min(100, Math.max(0, ((item.consultation || 0) / maxVal) * 100)) : 0;
              const pharmHeight = maxVal > 0 ? Math.min(100, Math.max(0, ((item.pharmacy || 0) / maxVal) * 100)) : 0;

              return (
                <div className="month-bar-group" key={idx}>
                  <div className="bars-pair">
                    <div
                      className="bar bar-blue"
                      style={{ height: `${consultHeight}%`, opacity: item.consultation > 0 ? 1 : 0.2 }}
                      title={`${item.month} Consultation: ${currencySymbol}${(item.consultation || 0).toLocaleString('en-IN')}`}
                    ></div>
                    <div
                      className="bar bar-peach"
                      style={{ height: `${pharmHeight}%`, opacity: item.pharmacy > 0 ? 1 : 0.2 }}
                      title={`${item.month} Pharmacy: ${currencySymbol}${(item.pharmacy || 0).toLocaleString('en-IN')}`}
                    ></div>
                  </div>
                  <span className="day-label">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Total Amount - 100% Dynamic */}
      <div className="revenue-card-footer">
        <span className="footer-total-label">Total Amount : </span>
        <span className="footer-total-val">{currencySymbol}{totalAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
};

export default RevenueOverviewChart;
