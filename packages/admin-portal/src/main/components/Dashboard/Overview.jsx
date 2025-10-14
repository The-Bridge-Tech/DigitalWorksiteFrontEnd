import React, { useState, useEffect } from 'react';
import { getSites } from '../../services/site.service';
import { getUsers } from '../../services/users.service';

const Overview = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalSites: 0,
    totalUsers: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      
      // Load both APIs concurrently but wait for both to complete
      const [sites, users] = await Promise.all([
        getSites().catch(() => []),
        getUsers().catch(() => [])
      ]);
      
      // Update stats only after both calls complete
      setStats({
        totalSites: sites?.length || 0,
        totalUsers: users?.length || 0,
        recentActivity: []
      });
      
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show partial data while loading
  const showPartialData = stats.totalSites > 0 || stats.totalUsers > 0;

  return (
    <div style={{ padding: '2rem' }}>
      {/* Loading indicator */}
      {loading && !showPartialData && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
          <p>Loading overview...</p>
        </div>
      )}
      
      {/* Show content even while loading if we have partial data */}
      {(showPartialData || !loading) && (
        <>
        {/* Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>
          🏠 Digital Worksite Overview
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
          Monitor your construction sites, track progress, and manage operations
        </p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏗️</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Total Sites</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#007bff' }}>
            {stats.totalSites}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>Active Users</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#28a745' }}>
            {stats.totalUsers}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>System Status</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#28a745' }}>
            ✅ Operational
          </p>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ marginTop: 0, color: '#495057' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onNavigate && onNavigate('checkins')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
            📱 Start Check-in
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('inspections')}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
            📋 New Inspection
          </button>
          <button 
            onClick={() => onNavigate && onNavigate('documents')}
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
            📁 Upload Document
          </button>
        </div>
      </div>
      
        </>
      )}
      
      {/* Loading overlay for partial updates */}
      {loading && showPartialData && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0,123,255,0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          ⚡ Updating...
        </div>
      )}
    </div>
  );
};

export default Overview;