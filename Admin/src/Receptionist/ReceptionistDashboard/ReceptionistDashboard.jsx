import React from 'react';
import './ReceptionistDashboard.css';
import Banner from './Banner';
import StatsGrid from './StatsGrid';
import AppointmentsTable from './AppointmentsTable';
import SidebarWidget from './SidebarWidget';

const ReceptionistDashboard = () => {
  return (
    <div className="rd-wrapper">
      <div className="rd-container">
        
        {/* Main Content Area */}
        <div className="rd-main">
          <Banner />
          <StatsGrid />
          <AppointmentsTable />
        </div>

        {/* Right Sidebar */}
        <SidebarWidget />

      </div>
    </div>
  );
};

export default ReceptionistDashboard;
