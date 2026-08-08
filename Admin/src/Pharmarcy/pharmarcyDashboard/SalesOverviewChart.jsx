import React, { useState } from 'react';
import './SalesOverviewChart.css';

const SalesOverviewChart = ({ dynamicChartData }) => {
  const [timeframe, setTimeframe] = useState('This Week');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Dynamic fallback / provided prop data
  const hasDynamicData = dynamicChartData && dynamicChartData.labels && dynamicChartData.labels.length > 0;

  const currentData = hasDynamicData ? dynamicChartData : {
    labels: ['30 Apr', '01 May', '02 May', '03 May', '04 May', '05 May', '06 May'],
    values: [10000, 20000, 14000, 17500, 22000, 26000, 23000]
  };

  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 20;

  const maxDataVal = Math.max(...currentData.values, 1000);
  const maxValue = Math.ceil(maxDataVal / 5000) * 5000 || 30000;

  const step = maxValue / 6;
  const yLabels = [
    `${Math.round(maxValue / 1000)}K`,
    `${Math.round((maxValue - step) / 1000)}K`,
    `${Math.round((maxValue - step * 2) / 1000)}K`,
    `${Math.round((maxValue - step * 3) / 1000)}K`,
    `${Math.round((maxValue - step * 4) / 1000)}K`,
    `${Math.round((maxValue - step * 5) / 1000)}K`,
    '0'
  ];

  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const points = currentData.values.map((val, index) => {
    const x = paddingX + (index * (graphWidth / Math.max(1, currentData.values.length - 1)));
    const y = height - paddingY - ((val / maxValue) * graphHeight);
    return { x, y, val, label: currentData.labels[index] };
  });

  const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`
    : '';

  return (
    <div className="sales-overview-card">
      <div className="chart-card-header">
        <h3 className="chart-title">Sales Overview</h3>
        <select 
          className="timeframe-select" 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
          <option value="Today">Today</option>
        </select>
      </div>

      <div className="chart-body-wrapper">
        {/* Y Axis Labels */}
        <div className="chart-y-axis">
          {yLabels.map((lbl, i) => (
            <span key={i}>{lbl}</span>
          ))}
        </div>

        {/* SVG Graph Area */}
        <div className="chart-svg-area">
          <div className="horizontal-grid-lines">
            {yLabels.map((_, i) => (
              <div key={i} className="grid-line" />
            ))}
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="sales-line-svg">
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Area under line */}
            {areaPath && <path d={areaPath} fill="url(#salesGradient)" />}

            {/* Main Blue Line */}
            {linePath && <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

            {/* Data Dots */}
            {points.map((pt, idx) => (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint === idx ? "7" : "5"}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="interactive-dot"
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            ))}
          </svg>

          {/* Dynamic Tooltip on Hover */}
          {hoveredPoint !== null && points[hoveredPoint] && (
            <div 
              className="sales-tooltip"
              style={{
                left: `${(points[hoveredPoint].x / width) * 100}%`,
                top: `${(points[hoveredPoint].y / height) * 100}%`
              }}
            >
              <div className="tooltip-date">{points[hoveredPoint].label}</div>
              <div className="tooltip-amount">₹ {points[hoveredPoint].val.toLocaleString('en-IN')}</div>
            </div>
          )}
        </div>
      </div>

      {/* X Axis Labels */}
      <div className="chart-x-axis">
        {currentData.labels.map((lbl, idx) => (
          <span key={idx}>{lbl}</span>
        ))}
      </div>

      {/* Legend */}
      <div className="chart-legend">
        <span className="legend-indicator"></span>
        <span className="legend-text">Sales (₹)</span>
      </div>
    </div>
  );
};

export default SalesOverviewChart;
