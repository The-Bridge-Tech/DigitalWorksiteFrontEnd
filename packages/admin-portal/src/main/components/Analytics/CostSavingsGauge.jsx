import React, { useState, useEffect } from 'react';

const CostSavingsGauge = () => {
  const [data, setData] = useState({ percentage: 0, amount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData({ percentage: 0, amount: 0 });
    setLoading(false);
  }, []);

  if (loading) return <div>Loading gauge...</div>;

  const percentage = Math.min(data.percentage, 100);
  const angle = (percentage / 100) * 180;
  const radians = (angle - 90) * (Math.PI / 180);
  
  const needleX = 150 + 50 * Math.cos(radians);
  const needleY = 150 + 50 * Math.sin(radians);

  return (
    <div style={{ height: '200px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 300 200">
        {/* Gauge background */}
        <path
          d="M 50 150 A 100 100 0 0 1 250 150"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="20"
        />
        
        {/* Gauge fill */}
        <path
          d="M 50 150 A 100 100 0 0 1 250 150"
          fill="none"
          stroke="#4ecdc4"
          strokeWidth="20"
          strokeDasharray={`${(percentage / 100) * 314} 314`}
          opacity="0.8"
        />
        
        {/* Needle */}
        <line
          x1="150"
          y1="150"
          x2={needleX}
          y2={needleY}
          stroke="#333"
          strokeWidth="3"
        />
        
        {/* Center dot */}
        <circle cx="150" cy="150" r="5" fill="#333" />
        
        {/* Percentage text */}
        <text x="150" y="130" fontSize="24" fill="#333" textAnchor="middle" fontWeight="bold">
          {percentage.toFixed(1)}%
        </text>
        
        {/* Amount text */}
        <text x="150" y="180" fontSize="14" fill="#666" textAnchor="middle">
          ${data.amount.toLocaleString()} saved
        </text>
        
        {/* Scale labels */}
        <text x="50" y="170" fontSize="10" fill="#666" textAnchor="middle">0%</text>
        <text x="150" y="60" fontSize="10" fill="#666" textAnchor="middle">50%</text>
        <text x="250" y="170" fontSize="10" fill="#666" textAnchor="middle">100%</text>
      </svg>
      
      {data.amount === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#666' }}>
          No data to display
          <div style={{ fontSize: '12px', marginTop: '5px' }}>Cost tracking data needed</div>
        </div>
      )}
    </div>
  );
};

export default CostSavingsGauge;