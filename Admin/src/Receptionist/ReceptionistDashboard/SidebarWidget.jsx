import React from 'react';
import { FaEllipsisV, FaBell, FaEnvelope, FaCog, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './SidebarWidget.css';

const SidebarWidget = () => {
  const beds = [
    { id: 1, name: 'General Ward', total: '12 Beds', status: 'Available' },
    { id: 2, name: 'Private Ward', total: '12 Beds', status: 'Available' },
    { id: 3, name: 'Semi-Private Ward', total: '12 Beds', status: 'Available' },
    { id: 4, name: 'ICU', total: '12 Beds', status: 'Available' },
    { id: 5, name: 'Emergency', total: '12 Beds', status: 'Available' },
    { id: 6, name: 'Pediatric Ward', total: '12 Beds', status: 'Available' },
  ];

  return (
    <div className="rd-sidebar">
      
      {/* Calendar Widget */}
      <div className="rd-sidebar-card">
        <div className="rd-calendar-header">
          <FaChevronLeft size={14} style={{cursor: 'pointer'}} />
          <span>June 2024</span>
          <FaChevronRight size={14} style={{cursor: 'pointer'}} />
        </div>
        <div className="rd-calendar-grid">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="rd-calendar-day-name">{day}</div>
          ))}
          
          <div className="rd-calendar-day">30</div>
          <div className="rd-calendar-day">31</div>
          <div className="rd-calendar-day">1</div>
          <div className="rd-calendar-day">2</div>
          <div className="rd-calendar-day">3</div>
          <div className="rd-calendar-day">4</div>
          <div className="rd-calendar-day">5</div>
          
          <div className="rd-calendar-day rd-red">6</div>
          <div className="rd-calendar-day">7</div>
          <div className="rd-calendar-day">8</div>
          <div className="rd-calendar-day">9</div>
          <div className="rd-calendar-day rd-active">10</div>
          <div className="rd-calendar-day">11</div>
          <div className="rd-calendar-day">12</div>
          
          <div className="rd-calendar-day rd-red">13</div>
          <div className="rd-calendar-day">14</div>
          <div className="rd-calendar-day">15</div>
          <div className="rd-calendar-day">16</div>
          <div className="rd-calendar-day">17</div>
          <div className="rd-calendar-day">18</div>
          <div className="rd-calendar-day">19</div>
          
          <div className="rd-calendar-day rd-red">20</div>
          <div className="rd-calendar-day">21</div>
          <div className="rd-calendar-day">22</div>
          <div className="rd-calendar-day">23</div>
          <div className="rd-calendar-day">24</div>
          <div className="rd-calendar-day">25</div>
          <div className="rd-calendar-day">26</div>

          <div className="rd-calendar-day rd-red">27</div>
          <div className="rd-calendar-day">28</div>
          <div className="rd-calendar-day">29</div>
          <div className="rd-calendar-day">30</div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rd-sidebar-card">
        <div className="rd-profile-header">
          <h3>Your Profile</h3>
          <FaEllipsisV size={14} style={{cursor: 'pointer', color: '#6b7280'}} />
        </div>
        <div className="rd-profile-img-container">
          <img 
            src="https://via.placeholder.com/80" 
            alt="Profile" 
            className="rd-profile-img" 
          />
        </div>
        <div className="rd-profile-info">
          <h4>Good Morning Prashant</h4>
          <p>Continue Your Journey And Achieve Your Target</p>
        </div>
        <div className="rd-profile-actions">
          <div className="rd-action-btn"><FaBell size={14} /></div>
          <div className="rd-action-btn"><FaEnvelope size={14} /></div>
          <div className="rd-action-btn"><FaCog size={14} /></div>
        </div>
      </div>

      {/* Available Beds */}
      <div className="rd-sidebar-card">
        <div className="rd-beds-header">
          <h3>Available Beds</h3>
          <button className="rd-btn-add"><FaPlus size={10} /></button>
        </div>
        <div className="rd-beds-list">
          {beds.map(bed => (
            <div key={bed.id} className="rd-bed-item">
              <div className="rd-bed-info-left">
                <img src={`https://via.placeholder.com/32`} alt="Bed" className="rd-bed-img" />
                <div className="rd-bed-details">
                  <h5>{bed.name}</h5>
                  <p>{bed.total}</p>
                </div>
              </div>
              <div className="rd-badge-available">{bed.status}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SidebarWidget;
