import React from 'react';
import './AppointmentSummary.css';

const AppointmentSummary = ({ data = { canceled: 0, rescheduled: 0, completed: 0 } }) => {
  const formatCount = (count) => {
    return count < 10 ? `0${count}` : count.toString();
  };

  const summaries = [
    {
      title: 'Canceled Appointment',
      count: formatCount(data.canceled || 0),
      bgColor: '#f8f9ff',
      textColor: '#5e72e4',
      iconColor: '#aab8ff'
    },
    {
      title: 'Reschedule Appointment',
      count: formatCount(data.rescheduled || 0),
      bgColor: '#f8f9ff',
      textColor: '#5e72e4',
      iconColor: '#6a67f3'
    },
    {
      title: 'Completed Appointment',
      count: formatCount(data.completed || 0),
      bgColor: '#f8f9ff',
      textColor: '#5e72e4',
      iconColor: '#aab8ff'
    }
  ];

  return (
    <div className="appointment-summary-card">
      <h3 className="section-title">Appointment Summary</h3>
      
      <div className="summary-list">
        {summaries.map((item, index) => (
          <div key={index} className="summary-list-item" style={{ backgroundColor: item.bgColor }}>
            <div className="summary-icon" style={{ color: item.iconColor }}>
              {/* Calendar Icon SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M9 16l2 2 4-4"></path> {/* Inner check mark / detail */}
              </svg>
            </div>
            <div className="summary-item-title">{item.title}</div>
            <div className="summary-item-count" style={{ color: item.textColor }}>{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentSummary;
