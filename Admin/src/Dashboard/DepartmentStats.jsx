import React from 'react';
import './DepartmentStats.css';

const DepartmentStats = ({ data = [] }) => {
  const defaultColors = ['#b9cbfb', '#d2dffd', '#9db6f9', '#aab8ff', '#859df2'];
  
  const departments = data.map((dept, index) => ({
    name: dept.name,
    count: dept.count,
    color: defaultColors[index % defaultColors.length]
  }));

  const total = departments.reduce((sum, dept) => sum + dept.count, 0);

  let currentAngle = 0;
  const segments = departments.map(dept => {
    if (total === 0) return null;
    const percentage = dept.count / total;
    const angle = percentage * 360;
    
    const x1 = 50 + 50 * Math.cos(Math.PI * (currentAngle - 90) / 180);
    const y1 = 50 + 50 * Math.sin(Math.PI * (currentAngle - 90) / 180);
    
    currentAngle += angle;
    
    const x2 = 50 + 50 * Math.cos(Math.PI * (currentAngle - 90) / 180);
    const y2 = 50 + 50 * Math.sin(Math.PI * (currentAngle - 90) / 180);
    
    const largeArcFlag = percentage > 0.5 ? 1 : 0;
    
    // If it's 100%, render a circle
    if (percentage === 1) {
      return <circle cx="50" cy="50" r="50" fill={dept.color} key={dept.name} />;
    }

    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    
    return <path d={pathData} fill={dept.color} stroke="#fff" strokeWidth="1" key={dept.name} />;
  });

  return (
    <div className="department-stats-card">
      <h3 className="section-title">Department Wise Statistics</h3>
      
      <div className="department-content">
        <div className="pie-chart-container">
          <svg viewBox="0 0 100 100" className="pie-chart">
            {total > 0 ? segments : <circle cx="50" cy="50" r="50" fill="#f0f0f0" />}
          </svg>
        </div>
        
        <div className="department-legend">
          {departments.map((dept, index) => (
            <div key={index} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: dept.color }}></div>
              <span className="legend-name">{dept.name} ({dept.count})</span>
            </div>
          ))}
          {departments.length === 0 && <div className="legend-name">No data available</div>}
        </div>
      </div>
    </div>
  );
};

export default DepartmentStats;
