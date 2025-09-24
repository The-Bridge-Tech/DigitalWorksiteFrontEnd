import React, { useState, useEffect } from 'react';

const PermitIntegrityChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData([]);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading chart...</div>;

  const total = data.reduce((sum, d) => sum + d.count, 0);
  let currentAngle = 0;

  return (
    <div style={{ height: '200px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 300 200">
        {data.map((d, i) => {
          const percentage = total > 0 ? d.count / total : 0;
          const angle = percentage * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = 150 + 60 * Math.cos(startAngle);
          const y1 = 100 + 60 * Math.sin(startAngle);
          const x2 = 150 + 60 * Math.cos(endAngle);
          const y2 = 100 + 60 * Math.sin(endAngle);
          
          const largeArcFlag = angle > Math.PI ? 1 : 0;
          const color = i === 0 ? '#4ecdc4' : '#ff6b6b';
          
          currentAngle += angle;
          
          return (
            <g key={i}>
              <path
                d={`M 150 100 L ${x1} ${y1} A 60 60 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={color}
                opacity="0.8"
              />
              <text
                x={150 + 40 * Math.cos(startAngle + angle / 2)}
                y={100 + 40 * Math.sin(startAngle + angle / 2)}
                fontSize="12"
                fill="white"
                textAnchor="middle"
                fontWeight="bold"
              >
                {d.percentage}%
              </text>
            </g>
          );
        })}
        
        {/* Legend */}
        {data.map((d, i) => (
          <g key={i}>
            <rect x="20" y={20 + i * 20} width="12" height="12" fill={i === 0 ? '#4ecdc4' : '#ff6b6b'} opacity="0.8" />
            <text x="40" y={30 + i * 20} fontSize="12" fill="#666">
              {d.type}: {d.count}
            </text>
          </g>
        ))}
      </svg>
      
      {total === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#666' }}>
          No data to display
          <div style={{ fontSize: '12px', marginTop: '5px' }}>Permit accuracy tracking needed</div>
        </div>
      )}
    </div>
  );
};

export default PermitIntegrityChart;