import React from 'react';
import './MonthlySummary.css';

const MonthlySummary = ({ data = [] }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Use data prop or fallback to 0s
  const dataPoints = data.length === 12 ? data : new Array(12).fill(0);
  
  // Find max value to dynamically scale Y-axis (min 50)
  const maxValue = Math.max(50, ...dataPoints);
  
  // Calculate SVG coordinates
  const width = 1000;
  const height = 200;
  
  // Generate path string
  const xStep = width / (months.length - 1);
  const points = dataPoints.map((val, index) => {
    const x = index * xStep;
    // Map value to height, inverted because SVG y goes down
    const y = height - (val / maxValue * height);
    return `${x},${y}`;
  });
  
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="monthly-summary-card">
      <h3 className="section-title">Monthly Appointment Summary</h3>
      
      <div className="chart-container">
        {/* Y-Axis labels */}
        <div className="y-axis">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.8)}</span>
          <span>{Math.round(maxValue * 0.6)}</span>
          <span>{Math.round(maxValue * 0.4)}</span>
          <span>{Math.round(maxValue * 0.2)}</span>
        </div>
        
        <div className="chart-area">
          {/* Horizontal grid lines */}
          <div className="grid-lines">
            <div className="grid-line"></div>
            <div className="grid-line"></div>
            <div className="grid-line"></div>
            <div className="grid-line"></div>
            <div className="grid-line"></div>
          </div>
          
          <div className="svg-wrapper">
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="area-chart">
              {/* Gradient for area */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e3ecff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f8faff" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              
              {/* Area */}
              <path d={areaPath} fill="url(#chartGradient)" />
              
              {/* Line */}
              <path d={linePath} fill="none" stroke="#6a82fb" strokeWidth="3" />
              
              {/* Data Points */}
              {dataPoints.map((val, index) => {
                const x = index * xStep;
                const y = height - (val / maxValue * height);
                return (
                  <circle key={index} cx={x} cy={y} r="5" fill="#6a82fb" stroke="#fff" strokeWidth="2" />
                );
              })}
            </svg>
          </div>
        </div>
      </div>
      
      {/* X-Axis labels */}
      <div className="x-axis">
        {months.map((month, index) => (
          <span key={index}>{month}</span>
        ))}
      </div>
    </div>
  );
};

export default MonthlySummary;
