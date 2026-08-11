import React from 'react';

import './StatCards.css';

const StatCards = ({ totalPatients, totalDoctors, totalAppointments, todaysAppointments }) => {
  const stats = [
    {
      title: 'Total Patients',
      value: totalPatients || '0',
      growth: '8.5% from last month',
      color: '#e5c0a1',
      bgColor: '#fafafa',
      growthColor: '#6a67f3'
    },
    {
      title: 'Total Doctors',
      value: totalDoctors || '0',
      growth: '4.2% from last month',
      color: '#ffb5bc',
      bgColor: '#fafafa',
      growthColor: '#6a67f3'
    },
    {
      title: 'Total Appointment',
      value: totalAppointments || '0',
      growth: '12.6% from last month',
      color: '#b29bfb',
      bgColor: '#f4f6fb',
      growthColor: '#6a67f3'
    },
    {
      title: "Today's Appointment",
      value: todaysAppointments || '0',
      growth: 'View',
      color: '#ffacf7',
      bgColor: '#fafafa',
      growthColor: '#6a67f3',
      isLink: true
    }
  ];

  return (
    <>
      {/* Existing 4 Appointment/Patient stat cards */}
      <div className="stat-cards-container">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ backgroundColor: stat.bgColor }}>
            <div className="stat-card-header">
              <div className="stat-color-indicator" style={{ backgroundColor: stat.color }}></div>
              <div className="stat-title">{stat.title}</div>
            </div>
            <div className="stat-value">{stat.value}</div>
            {stat.isLink ? (
              <a href="#" className="stat-growth link">{stat.growth}</a>
            ) : (
              <div className="stat-growth" style={{ color: stat.growthColor }}>
                {stat.growth}
              </div>
            )}
          </div>
        ))}
      </div>

    </>
  );
};

export default StatCards;
