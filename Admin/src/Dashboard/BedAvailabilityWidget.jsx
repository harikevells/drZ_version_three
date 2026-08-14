import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaBed, FaChevronRight } from 'react-icons/fa';
import './BedAvailabilityWidget.css';

const BedAvailabilityWidget = ({ bedData }) => {
  const navigate = useNavigate();

  const categories = bedData && bedData.length > 0 ? bedData : [
    { type: 'General ward', occupied: 45, total: 58, available: 13, color: '#3b82f6', bgIcon: '#e0e7ff', iconColor: '#6366f1' },
    { type: 'ICU', occupied: 50, total: 55, available: 5, color: '#be185d', bgIcon: '#fce7f3', iconColor: '#ec4899' },
    { type: 'Emergency', occupied: 11, total: 13, available: 2, color: '#ea580c', bgIcon: '#ffedd5', iconColor: '#f97316' },
    { type: 'Private Room', occupied: 10, total: 13, available: 7, color: '#334155', bgIcon: '#e2e8f0', iconColor: '#475569' }
  ];

  return (
    <div className="admin-chart-card bed-availability-card">
      <div className="chart-card-header">
        <div className="card-header-left">
          <FaCalendarAlt className="header-icon" />
          <h3>Bed Availability</h3>
        </div>
      </div>

      <div className="bed-category-list">
        {categories.map((cat, idx) => {
          const occupied = cat.occupied ?? 0;
          const total = cat.total ?? 1;
          const available = cat.available ?? Math.max(0, total - occupied);
          const pct = Math.min(100, Math.round((occupied / total) * 100));

          return (
            <div
              key={idx}
              className="bed-cat-item"
              onClick={() => navigate('/room-management')}
            >
              <div className="bed-cat-left">
                <div className="bed-icon-circle" style={{ backgroundColor: cat.bgIcon, color: cat.iconColor }}>
                  <FaBed />
                </div>
                <div className="bed-cat-info">
                  <h4 className="bed-cat-title">{cat.type}</h4>
                  <span className="bed-cat-sub">{occupied}/{total} beds</span>
                </div>
              </div>

              <div className="bed-cat-center">
                <div className="bed-progress-bg">
                  <div
                    className="bed-progress-fill"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  ></div>
                </div>
              </div>

              <div className="bed-cat-right">
                <span className="available-green-badge">{available}Available</span>
                <FaChevronRight className="cat-arrow" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BedAvailabilityWidget;
