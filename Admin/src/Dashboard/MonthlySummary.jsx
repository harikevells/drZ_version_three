import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './MonthlySummary.css';

const MonthlySummary = ({ data = [] }) => {
  const [activePoint, setActivePoint] = useState(null);
  const [monthlyDetailedStats, setMonthlyDetailedStats] = useState(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Calculate raw number array to map graph height from the props data
  const dataPoints = data.length === 12 ? data.map(d => typeof d === 'number' ? d : 0) : new Array(12).fill(0);

  useEffect(() => {
    const fetchAccurateStats = async () => {
      try {
        const doctorsRes = await axios.get(`${API_BASE_URL}/doctors`);
        const doctors = doctorsRes.data;
        
        let allAppointments = [];
        for (const doc of doctors) {
            const docName = doc.doctorName || doc.name || doc.doctor_name || doc.username;
            if (docName) {
                const apptRes = await axios.get(`${API_BASE_URL}/appointments/all/${encodeURIComponent(docName)}`);
                if (apptRes.data && Array.isArray(apptRes.data)) {
                    allAppointments = [...allAppointments, ...apptRes.data];
                }
            }
        }
        
        const stats = Array.from({ length: 12 }, () => ({
            pending: 0, completed: 0, cancelled: 0, rescheduled: 0
        }));
        
        const today = new Date();
        const yyyy = today.getFullYear();

        allAppointments.forEach(app => {
            if (app.appointment_date) {
                const parts = app.appointment_date.split('/');
                if (parts.length === 3) {
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    if (year === yyyy && month >= 0 && month < 12) {
                        const s = (app.status || '').toLowerCase();
                        // Add approved and confirm to pending
                        if (s === 'pending' || s === 'approved' || s === 'confirm') {
                            stats[month].pending++;
                        } else if (s === 'completed') {
                            stats[month].completed++;
                        } else if (s === 'cancelled' || s === 'canceled') {
                            stats[month].cancelled++;
                        } else if (s === 'rescheduled') {
                            stats[month].rescheduled++;
                        }
                    }
                }
            }
        });
        
        setMonthlyDetailedStats(stats);
      } catch (err) {
        console.error("Error fetching detailed stats for tooltip:", err);
      }
    };
    
    fetchAccurateStats();
  }, []);

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

  const handleInteraction = (x, y, index, stats) => {
    setActivePoint({ x, y, index, ...stats });
  };

  return (
    <div className="monthly-summary-card" onClick={(e) => {
      // Close tooltip if clicking outside the SVG area
      if (e.target.tagName !== 'circle' && activePoint) {
        setActivePoint(null);
      }
    }}>
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
        
        <div className="chart-area" style={{ position: 'relative' }}>
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
                const isHovered = activePoint && activePoint.index === index;
                
                const details = monthlyDetailedStats ? monthlyDetailedStats[index] : {
                  pending: 0, completed: 0, cancelled: 0, rescheduled: 0
                };
                
                const stats = {
                  total: val,
                  pending: details.pending,
                  completed: details.completed,
                  cancelled: details.cancelled,
                  rescheduled: details.rescheduled
                };
                
                return (
                  <circle 
                    key={index} 
                    cx={x} 
                    cy={y} 
                    r={isHovered ? "8" : "6"} 
                    fill={isHovered ? "#4e66d9" : "#6a82fb"} 
                    stroke="#fff" 
                    strokeWidth="2" 
                    onMouseEnter={() => handleInteraction(x, y, index, stats)}
                    onMouseLeave={() => setActivePoint(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInteraction(x, y, index, stats);
                    }}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    className="chart-dot"
                  />
                );
              })}
            </svg>
            
            {/* Tooltip */}
            {activePoint && (
              <div 
                className="chart-tooltip" 
                style={{ 
                  left: `${(activePoint.x / width) * 100}%`, 
                  top: `${(activePoint.y / height) * 100}%` 
                }}
              >
                <div className="tooltip-title">{months[activePoint.index]}</div>
                <div className="tooltip-row"><span>Total:</span> <strong>{activePoint.total}</strong></div>
                <div className="tooltip-row"><span>Completed:</span> <strong style={{color: '#4caf50'}}>{activePoint.completed}</strong></div>
                <div className="tooltip-row"><span>Pending:</span> <strong style={{color: '#ff9800'}}>{activePoint.pending}</strong></div>
                <div className="tooltip-row"><span>Rescheduled:</span> <strong style={{color: '#2196f3'}}>{activePoint.rescheduled}</strong></div>
                <div className="tooltip-row"><span>Cancelled:</span> <strong style={{color: '#f44336'}}>{activePoint.cancelled}</strong></div>
              </div>
            )}
            
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
