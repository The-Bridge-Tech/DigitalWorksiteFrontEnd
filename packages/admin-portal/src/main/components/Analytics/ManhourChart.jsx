import React, { useState, useEffect } from 'react';

const ManhourChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No real data source available yet
    setData([]);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading chart...</div>;

  const maxValue = Math.max(...data.map(d => Math.max(d.planned, d.actual)), 1);

  return (
    <div style={{ height: '200px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 400 200">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line key={i} x1="50" y1={40 + i * 30} x2="350" y2={40 + i * 30} stroke="#f0f0f0" strokeWidth="1" />
        ))}
        
        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => (
          <text key={i} x="40" y={45 + i * 30} fontSize="10" fill="#666" textAnchor="end">
            {Math.round(maxValue - (i * maxValue / 4))}h
          </text>
        ))}
        
        {/* Bars */}
        {data.map((d, i) => {
          const x = 60 + i * 45;
          const plannedHeight = (d.planned / maxValue) * 120;
          const actualHeight = (d.actual / maxValue) * 120;
          
          return (
            <g key={i}>
              {/* Planned bar */}
              <rect
                x={x}
                y={160 - plannedHeight}
                width="18"
                height={plannedHeight}
                fill="#ff6b6b"
                opacity="0.8"
              />
              {/* Actual bar */}
              <rect
                x={x + 20}
                y={160 - actualHeight}
                width="18"
                height={actualHeight}
                fill="#4ecdc4"
                opacity="0.8"
              />
              {/* Month label */}
              <text x={x + 19} y="180" fontSize="10" fill="#666" textAnchor="middle">
                {d.month}
              </text>
            </g>
          );
        })}
        
        {/* X-axis */}
        <line x1="50" y1="160" x2="350" y2="160" stroke="#333" strokeWidth="1" />
        
        {/* Legend */}
        <rect x="250" y="20" width="12" height="12" fill="#ff6b6b" opacity="0.8" />
        <text x="270" y="30" fontSize="10" fill="#666">Planned</text>
        <rect x="250" y="35" width="12" height="12" fill="#4ecdc4" opacity="0.8" />
        <text x="270" y="45" fontSize="10" fill="#666">Actual</text>
      </svg>
      
      {data.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#666' }}>
          No data to display
          <div style={{ fontSize: '12px', marginTop: '5px' }}>Manhour tracking data needed</div>
        </div>
      )}
    </div>
  );
};

export default ManhourChart;