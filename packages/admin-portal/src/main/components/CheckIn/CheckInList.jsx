import React, { useState, useEffect } from 'react';

const CheckInList = () => {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCheckins();
  }, []);

  const loadCheckins = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5004/checkins', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCheckins(data);
      } else {
        setError('Failed to load check-ins');
      }
    } catch (error) {
      console.error('Error loading check-ins:', error);
      setError('Error loading check-ins');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading check-ins...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Site Check-Ins</h2>
        <button 
          onClick={loadCheckins}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {checkins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No check-ins found
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {checkins.map(checkin => (
            <div 
              key={checkin.id} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px',
                backgroundColor: '#f8f9fa'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <strong>User:</strong> {checkin.user_name}
                </div>
                <div>
                  <strong>Role:</strong> {checkin.user_role}
                </div>
                <div>
                  <strong>Site:</strong> {checkin.site_id}
                </div>
                <div>
                  <strong>Time:</strong> {new Date(checkin.timestamp).toLocaleString()}
                </div>
                <div>
                  <strong>GPS:</strong> {checkin.gps_latitude && checkin.gps_longitude 
                    ? `${checkin.gps_latitude.toFixed(6)}, ${checkin.gps_longitude.toFixed(6)}`
                    : 'Not available'
                  }
                </div>
                <div>
                  <strong>Weather:</strong> {checkin.weather_conditions || 'Not available'}
                </div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                QR Scan ID: {checkin.qr_scan_id} | Check-in ID: {checkin.checkin_id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckInList;