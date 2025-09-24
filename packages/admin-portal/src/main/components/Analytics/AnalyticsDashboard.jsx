import React, { useState, useEffect } from 'react';
import SiteVisitChart from './SiteVisitChart';
import ManhourChart from './ManhourChart';
import PermitIntegrityChart from './PermitIntegrityChart';
import CostSavingsGauge from './CostSavingsGauge';
import ErrorRateChart from './ErrorRateChart';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading analytics...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Analytics Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h3>Site Visit Duration</h3>
          <SiteVisitChart />
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h3>Manhour Reduction</h3>
          <ManhourChart />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h3>Permit Integrity</h3>
          <PermitIntegrityChart />
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h3>Cost Savings</h3>
          <CostSavingsGauge />
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h3>Error Rate</h3>
          <ErrorRateChart />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;