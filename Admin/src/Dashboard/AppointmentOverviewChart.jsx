import React, { useState } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './AppointmentOverviewChart.css';

const AppointmentOverviewChart = ({ data }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const total = data?.total ?? 156;
  const todaysCount = data?.todaysCount ?? Math.round(total * 0.6);
  const completedCount = data?.completedCount ?? Math.round(total * 0.2);
  const pendingCount = data?.pendingCount ?? Math.round(total * 0.2);
  const cancelledCount = data?.cancelledCount ?? Math.round(total * 0.1);

  const todaysPct = total > 0 ? Math.min(100, Math.round((todaysCount / total) * 100)) : 60;
  const completedPct = total > 0 ? Math.min(100, Math.round((completedCount / total) * 100)) : 20;
  const pendingPct = total > 0 ? Math.min(100, Math.round((pendingCount / total) * 100)) : 20;
  const cancelledPct = total > 0 ? Math.min(100, Math.round((cancelledCount / total) * 100)) : 20;

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthYearStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculation for SVG donut segments
  const strokeWidth = 14;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const getOffset = (pctSoFar) => circumference - (pctSoFar / 100) * circumference;

  // Segment percentages normalized
  const sumPct = todaysPct + completedPct + pendingPct + cancelledPct || 100;
  const p1 = (todaysPct / sumPct) * 100;
  const p2 = (completedPct / sumPct) * 100;
  const p3 = (pendingPct / sumPct) * 100;
  const p4 = (cancelledPct / sumPct) * 100;

  const strokeDash1 = (p1 / 100) * circumference;
  const strokeDash2 = (p2 / 100) * circumference;
  const strokeDash3 = (p3 / 100) * circumference;
  const strokeDash4 = (p4 / 100) * circumference;

  const offset1 = 0;
  const offset2 = -strokeDash1;
  const offset3 = -(strokeDash1 + strokeDash2);
  const offset4 = -(strokeDash1 + strokeDash2 + strokeDash3);

  return (
    <div className="admin-chart-card appointment-overview-card">
      <div className="chart-card-header">
        <div className="card-header-left">
          <FaCalendarAlt className="header-icon" />
          <h3>Appointment Overview</h3>
        </div>
        <div className="month-navigator">
          <button onClick={handlePrevMonth} className="nav-btn"><FaChevronLeft /></button>
          <span className="month-label">{monthYearStr}</span>
          <button onClick={handleNextMonth} className="nav-btn"><FaChevronRight /></button>
        </div>
      </div>

      <div className="donut-chart-body">
        {/* SVG Donut */}
        <div className="donut-wrapper">
          <svg width="150" height="150" viewBox="0 0 150 150" className="donut-svg">
            <g transform="rotate(-90 75 75)">
              {/* Segment 1: Today's Appointments (Yellow) */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="#eab308"
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeDash1} ${circumference}`}
                strokeDashoffset={offset1}
              />
              {/* Segment 2: Completed (Blue) */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeDash2} ${circumference}`}
                strokeDashoffset={offset2}
              />
              {/* Segment 3: Pending (Orange) */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="#f97316"
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeDash3} ${circumference}`}
                strokeDashoffset={offset3}
              />
              {/* Segment 4: Cancelled (Pink) */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="#f43f5e"
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeDash4} ${circumference}`}
                strokeDashoffset={offset4}
              />
            </g>
          </svg>
          <div className="donut-center-text">
            <span className="center-label">Total</span>
            <span className="center-val">{total}</span>
          </div>
        </div>

        {/* Legend Right */}
        <div className="donut-legend-list">
          <div className="legend-item">
            <div className="legend-left">
              <span className="dot dot-yellow"></span>
              <span className="legend-title">Today's Appointments</span>
            </div>
            <span className="legend-pct">{todaysPct}%</span>
          </div>

          <div className="legend-item">
            <div className="legend-left">
              <span className="dot dot-blue"></span>
              <span className="legend-title">Completed</span>
            </div>
            <span className="legend-pct">{completedPct}%</span>
          </div>

          <div className="legend-item">
            <div className="legend-left">
              <span className="dot dot-orange"></span>
              <span className="legend-title">Pending</span>
            </div>
            <span className="legend-pct">{pendingPct}%</span>
          </div>

          <div className="legend-item">
            <div className="legend-left">
              <span className="dot dot-pink"></span>
              <span className="legend-title">Cancelled</span>
            </div>
            <span className="legend-pct">{cancelledPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentOverviewChart;
