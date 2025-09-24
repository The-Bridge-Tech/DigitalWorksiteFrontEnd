import React, { useState, useEffect } from 'react';

const SiteVisitChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5004/checkins', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          const checkins = await response.json();
          // Process checkins - need check-out times to calculate duration
          const processedData = checkins.slice(0, 10).map((checkin, index) => ({
            duration: 0, // Would need check-out time to calculate actual duration
            user: checkin.user_name,
            site: checkin.site_id
          }));
          setData(processedData);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching site visit data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading chart...</div>;

  const maxDuration = Math.max(...data.map(d => d.duration), 1);

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
            {(maxDuration - (i * maxDuration / 4)).toFixed(1)}h
          </text>
        ))}
        
        {/* Line chart */}
        {data.length > 1 && (
          <polyline
            points={data.map((d, i) => 
              `${50 + (i * 300 / (data.length - 1))},${160 - (d.duration / maxDuration) * 120}`
            ).join(' ')}
            fill="none"
            stroke="#007bff"
            strokeWidth="2"
          />
        )}
        
        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={50 + (i * 300 / Math.max(data.length - 1, 1))}
            cy={160 - (d.duration / maxDuration) * 120}
            r="4"
            fill="#007bff"
          />
        ))}
        
        {/* X-axis */}
        <line x1="50" y1="160" x2="350" y2="160" stroke="#333" strokeWidth="1" />
        <text x="200" y="185" fontSize="12" fill="#666" textAnchor="middle">Users/Sites</text>
      </svg>
      
      {data.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#666' }}>
          No data to display
          <div style={{ fontSize: '12px', marginTop: '5px' }}>Check-in/check-out data needed</div>
        </div>
      )}
    </div>
  );
};

export default SiteVisitChart;