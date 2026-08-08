import React from 'react';
import './StockStatusChart.css';

const StockStatusChart = ({ data }) => {
  const {
    inStock = 876,
    lowStock = 32,
    outOfStock = 41,
    expired = 18,
    total = 1245
  } = data || {};

  const inStockPct = ((inStock / total) * 100).toFixed(1);
  const lowStockPct = ((lowStock / total) * 100).toFixed(1);
  const outOfStockPct = ((outOfStock / total) * 100).toFixed(1);
  const expiredPct = ((expired / total) * 100).toFixed(1);

  // SVG Donut calculation
  const radius = 70;
  const strokeWidth = 18;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  // Segment strokeDasharrays
  const strokeInStock = (inStock / total) * circumference;
  const strokeLowStock = (lowStock / total) * circumference;
  const strokeOutOfStock = (outOfStock / total) * circumference;
  const strokeExpired = (expired / total) * circumference;

  // Offsets
  const offsetInStock = 0;
  const offsetLowStock = -strokeInStock;
  const offsetOutOfStock = -(strokeInStock + strokeLowStock);
  const offsetExpired = -(strokeInStock + strokeLowStock + strokeOutOfStock);

  return (
    <div className="stock-status-card">
      <h3 className="stock-card-title">Stock Status</h3>

      <div className="stock-body">
        {/* SVG Donut Chart */}
        <div className="donut-wrapper">
          <svg viewBox="0 0 200 200" className="donut-svg">
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* In Stock - Green */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeInStock} ${circumference - strokeInStock}`}
              strokeDashoffset={offsetInStock}
              transform="rotate(-90 100 100)"
              strokeLinecap="round"
            />

            {/* Low Stock - Blue */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeLowStock} ${circumference - strokeLowStock}`}
              strokeDashoffset={offsetLowStock}
              transform="rotate(-90 100 100)"
              strokeLinecap="round"
            />

            {/* Out of Stock - Orange */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#f97316"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeOutOfStock} ${circumference - strokeOutOfStock}`}
              strokeDashoffset={offsetOutOfStock}
              transform="rotate(-90 100 100)"
              strokeLinecap="round"
            />

            {/* Expired - Red */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeExpired} ${circumference - strokeExpired}`}
              strokeDashoffset={offsetExpired}
              transform="rotate(-90 100 100)"
              strokeLinecap="round"
            />
          </svg>

          {/* Center Text */}
          <div className="donut-center-text">
            <span className="center-sub">Total</span>
            <span className="center-count">{total.toLocaleString('en-IN')}</span>
            <span className="center-label">Medicines</span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="stock-legend-list">
          <div className="legend-item">
            <div className="legend-label-group">
              <span className="legend-dot dot-green"></span>
              <span className="legend-name">In Stock</span>
            </div>
            <span className="legend-value">{inStock} ({inStockPct}%)</span>
          </div>

          <div className="legend-item">
            <div className="legend-label-group">
              <span className="legend-dot dot-blue"></span>
              <span className="legend-name">Low Stock</span>
            </div>
            <span className="legend-value">{lowStock} ({lowStockPct}%)</span>
          </div>

          <div className="legend-item">
            <div className="legend-label-group">
              <span className="legend-dot dot-orange"></span>
              <span className="legend-name">Out of Stock</span>
            </div>
            <span className="legend-value">{outOfStock} ({outOfStockPct}%)</span>
          </div>

          <div className="legend-item">
            <div className="legend-label-group">
              <span className="legend-dot dot-red"></span>
              <span className="legend-name">Expired</span>
            </div>
            <span className="legend-value">{expired} ({expiredPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockStatusChart;
