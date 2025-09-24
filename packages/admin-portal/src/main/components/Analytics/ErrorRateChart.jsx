import React, { useState, useEffect } from 'react';

const ErrorRateChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData([]);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading chart...</div>;

  const maxRate = Math.max(...data.map(d => d.error_rate), 1);

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
            {(maxRate - (i * maxRate / 4)).toFixed(1)}%
          </text>
        ))}
        
        {/* Area under curve */}
        {data.length > 1 && (
          <path
            d={`M 50 160 ${data.map((d, i) => 
              `L ${50 + (i * 300 / (data.length - 1))} ${160 - (d.error_rate / maxRate) * 120}`
            ).join(' ')} L 350 160 Z`}
            fill="#ff6b6b"
            opacity="0.3"
          />
        )}
        
        {/* Curve line */}
        {data.length > 1 && (
          <path
            d={`M ${data.map((d, i) => 
              `${50 + (i * 300 / (data.length - 1))},${160 - (d.error_rate / maxRate) * 120}`
            ).join(' L ')}`}
            fill="none"
            stroke="#ff6b6b"
            strokeWidth="2"
          />
        )}
        
        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={50 + (i * 300 / Math.max(data.length - 1, 1))}
            cy={160 - (d.error_rate / maxRate) * 120}
            r="3"
            fill="#ff6b6b"
          />
        ))}
        
        {/* X-axis */}
        <line x1="50" y1="160" x2="350" y2="160" stroke="#333" strokeWidth="1" />
        <text x="200" y="185" fontSize="12" fill="#666" textAnchor="middle">Time Period</text>
      </svg>
      
      {data.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#666' }}>
          No data to display
          <div style={{ fontSize: '12px', marginTop: '5px' }}>Error tracking data needed</div>
        </div>
      )}
    </div>
  );
};

export default ErrorRateChart;