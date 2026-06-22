import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api.config.js';

const CheckInList = () => {
  const [checkins, setCheckins] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load both checkins and sites
      const [checkinsResponse, sitesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/checkins`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch(`${API_BASE_URL}/sites`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      ]);

      if (checkinsResponse.ok && sitesResponse.ok) {
        const checkinsData = await checkinsResponse.json();
        const sitesData = await sitesResponse.json();
        
        setCheckins(checkinsData);
        setSites(sitesData);
      } else {
        setError('Failed to load data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site ? `${site.name} (${siteId})` : siteId;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading check-ins...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: '100%', margin: 'clamp(0.75rem, 3vw, 1.25rem) auto', padding: 'clamp(0.75rem, 3vw, 1.25rem)', overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: window.innerWidth < 768 ? 'stretch' : 'center', 
        marginBottom: 'clamp(1rem, 3vw, 1.25rem)',
        gap: 'clamp(0.5rem, 2vw, 1rem)'
      }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>Site Check-Ins</h2>
        <button 
          onClick={loadData}
          style={{ 
            padding: 'clamp(0.5rem, 2vw, 0.5rem) clamp(0.75rem, 3vw, 1rem)', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
            minHeight: '44px',
            whiteSpace: 'nowrap'
          }}
        >
          Refresh
        </button>
      </div>

      {checkins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'clamp(2rem, 5vw, 2.5rem)', color: '#666' }}>
          No check-ins found
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'clamp(0.75rem, 3vw, 0.9375rem)' }}>
          {checkins.map(checkin => (
            <div 
              key={checkin.id} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: 'clamp(0.75rem, 3vw, 0.9375rem)',
                backgroundColor: '#f8f9fa',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
                gap: 'clamp(0.5rem, 2vw, 0.625rem)'
              }}>
                <div style={{ wordBreak: 'break-word' }}>
                  <strong>User:</strong> {checkin.user_name}
                </div>
                <div style={{ wordBreak: 'break-word' }}>
                  <strong>Role:</strong> {checkin.user_role}
                </div>
                <div style={{ wordBreak: 'break-word' }}>
                  <strong>Site:</strong> {getSiteName(checkin.site_id)}
                </div>
                <div style={{ wordBreak: 'break-word' }}>
                  <strong>Time:</strong> {new Date(checkin.timestamp).toLocaleString()}
                </div>
                <div style={{ wordBreak: 'break-word' }}>
                  <strong>GPS:</strong> {checkin.gps_latitude && checkin.gps_longitude 
                    ? `${checkin.gps_latitude.toFixed(6)}, ${checkin.gps_longitude.toFixed(6)}`
                    : 'Not available'
                  }
                </div>
                <div style={{ wordBreak: 'break-word' }}>
                  <strong>Weather:</strong> {checkin.weather_conditions || 'Not available'}
                </div>
              </div>
              <div style={{ marginTop: 'clamp(0.5rem, 2vw, 0.625rem)', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)', color: '#666', wordBreak: 'break-all' }}>
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