import React from 'react';
import { FaShoppingCart, FaRupeeSign, FaTimesCircle } from 'react-icons/fa';
import './StatCards.css';

const StatCards = ({ totalPatients, totalDoctors, totalAppointments, todaysAppointments, todaysSales = 0, totalSales = 0, outOfStock = 0 }) => {
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

      {/* Pharmacy Stats Row: Today's Sales, Out of Stock, Today's Profit */}
      <div className="stat-cards-container" style={{ marginTop: '16px' }}>
        {/* Today's Sales */}
        <div className="stat-card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="stat-card-header">
            <div className="stat-color-indicator" style={{ backgroundColor: '#22c55e' }}></div>
            <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaShoppingCart size={13} color="#16a34a" /> Today's Sales
            </div>
          </div>
          <div className="stat-value" style={{ color: '#15803d' }}>
            ₹ {todaysSales.toLocaleString('en-IN')}
          </div>
          <div className="stat-growth" style={{ color: '#16a34a' }}>
            From pharmacy billing today
          </div>
        </div>

        {/* Out of Stock */}
        <div className="stat-card" style={{ backgroundColor: outOfStock > 0 ? '#fff7ed' : '#f0fdf4', border: `1px solid ${outOfStock > 0 ? '#fed7aa' : '#bbf7d0'}` }}>
          <div className="stat-card-header">
            <div className="stat-color-indicator" style={{ backgroundColor: outOfStock > 0 ? '#f97316' : '#22c55e' }}></div>
            <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaTimesCircle size={13} color={outOfStock > 0 ? '#ea580c' : '#16a34a'} /> Out of Stock
            </div>
          </div>
          <div className="stat-value" style={{ color: outOfStock > 0 ? '#ea580c' : '#15803d' }}>
            {outOfStock} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>medicines</span>
          </div>
          <div className="stat-growth" style={{ color: outOfStock > 0 ? '#ea580c' : '#16a34a' }}>
            {outOfStock > 0 ? '⚠ Needs restocking' : '✓ All stocked'}
          </div>
        </div>

        {/* Total Sales */}
        <div className="stat-card" style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <div className="stat-card-header">
            <div className="stat-color-indicator" style={{ backgroundColor: '#a855f7' }}></div>
            <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaRupeeSign size={13} color="#9333ea" /> Total Sales
            </div>
          </div>
          <div className="stat-value" style={{ color: '#7c3aed' }}>
            ₹ {totalSales.toLocaleString('en-IN')}
          </div>
          <div className="stat-growth" style={{ color: '#9333ea' }}>
            Overall pharmacy billing amount
          </div>
        </div>

        {/* Empty placeholder to maintain 4-column grid */}
        <div className="stat-card" style={{ backgroundColor: 'transparent', border: '1px dashed #e2e8f0', boxShadow: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
            Pharmacy Overview
          </div>
        </div>
      </div>
    </>
  );
};

export default StatCards;
