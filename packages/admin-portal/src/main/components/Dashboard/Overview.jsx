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
      const [sites, users] = await Promise.all([
        getSites().catch(() => []),
        getUsers().catch(() => [])
      ]);
      
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

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
        <p>Loading overview...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: '#343a40' }}>Digital Workspace Overview</h1>
      
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
    </div>
  );
};

export default Overview;