import React, { useState, useEffect } from 'react';
// @ts-ignore
import SearchJob from '@splunk/search-job';
import { useSite } from '../SiteContext';

const AnalyticsDashboard = () => {
  const { userSites, isAdmin } = useSite();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inspectionStats, setInspectionStats] = useState([]);
  const [checkinStats, setCheckinStats] = useState([]);
  const [inspectorStats, setInspectorStats] = useState([]);
  const [timelineStats, setTimelineStats] = useState([]);
  const [hazardStats, setHazardStats] = useState([]);

  useEffect(() => {
    if (userSites.length > 0 || isAdmin()) {
      loadAnalytics();
    }
  }, [userSites]);

  async function loadAnalytics() {
    setLoading(true);
    setError('');
    
    try {
      const userSiteNames = userSites.map(s => s.name);
      
      // Load inspection stats - fetch all, filter on frontend
      const inspectionQuery = `index=dwa_inspections sourcetype=inspections | stats count by status, asset_id, inspector`;
      const inspectionJob = SearchJob.create({
        search: inspectionQuery,
        earliest_time: '-30d@d',
        latest_time: 'now'
      });
      
      inspectionJob.getResults().subscribe({
        next: (data) => {
          let results = data?.results || [];
          if (!isAdmin() && userSiteNames.length > 0) {
            const lowerSiteNames = userSiteNames.map(s => s.toLowerCase().replace(/\s+/g, '_'));
            results = results.filter(r => {
              const assetId = (r.asset_id || '').toLowerCase();
              return lowerSiteNames.some(site => assetId.includes(site));
            });
          }
          setInspectionStats(results);
        },
        error: (err) => console.error('Inspection query error:', err)
      });

      // Load check-in stats - fetch all, filter on frontend
      const checkinQuery = `index=dwa_checkins sourcetype=checkins | stats count by site_name, user_role`;
      const checkinJob = SearchJob.create({
        search: checkinQuery,
        earliest_time: '-30d@d',
        latest_time: 'now'
      });
      
      checkinJob.getResults().subscribe({
        next: (data) => {
          let results = data?.results || [];
          if (!isAdmin() && userSiteNames.length > 0) {
            const lowerSiteNames = userSiteNames.map(s => s.toLowerCase().replace(/\s+/g, '_'));
            results = results.filter(r => {
              const siteName = (r.site_name || '').toLowerCase().replace(/\s+/g, '_');
              return lowerSiteNames.some(site => siteName.includes(site));
            });
          }
          setCheckinStats(results);
        },
        error: (err) => console.error('Check-in query error:', err)
      });

      // Load inspector activity - fetch all, filter on frontend
      const inspectorQuery = `index=dwa_inspections sourcetype=inspections | stats count by inspector, asset_id`;
      const inspectorJob = SearchJob.create({
        search: inspectorQuery,
        earliest_time: '-30d@d',
        latest_time: 'now'
      });
      
      inspectorJob.getResults().subscribe({
        next: (data) => {
          let results = data?.results || [];
          // Filter on frontend for non-admin users
          if (!isAdmin() && userSiteNames.length > 0) {
            const lowerSiteNames = userSiteNames.map(s => s.toLowerCase().replace(/\s+/g, '_'));
            results = results.filter(r => {
              const assetId = (r.asset_id || '').toLowerCase();
              return lowerSiteNames.some(site => assetId.includes(site));
            });
          }
          // Group by inspector
          const inspectorMap = {};
          results.forEach(r => {
            const inspector = r.inspector || 'Unknown';
            inspectorMap[inspector] = (inspectorMap[inspector] || 0) + (parseInt(r.count) || 0);
          });
          const inspectorResults = Object.entries(inspectorMap).map(([inspector, count]) => ({ inspector, count: String(count) }));
          setInspectorStats(inspectorResults);
        },
        error: (err) => console.error('Inspector query error:', err)
      });

      // Load timeline data - fetch all, filter on frontend
      const timelineQuery = `index=dwa_inspections sourcetype=inspections | bucket _time span=1d | stats count by _time, asset_id`;
      const timelineJob = SearchJob.create({
        search: timelineQuery,
        earliest_time: '-30d@d',
        latest_time: 'now'
      });
      
      timelineJob.getResults().subscribe({
        next: (data) => {
          let results = data?.results || [];
          // Filter on frontend for non-admin users
          if (!isAdmin() && userSiteNames.length > 0) {
            const lowerSiteNames = userSiteNames.map(s => s.toLowerCase().replace(/\s+/g, '_'));
            results = results.filter(r => {
              const assetId = (r.asset_id || '').toLowerCase();
              return lowerSiteNames.some(site => assetId.includes(site));
            });
          }
          // Group by time
          const timeMap = {};
          results.forEach(r => {
            const time = r._time;
            timeMap[time] = (timeMap[time] || 0) + (parseInt(r.count) || 0);
          });
          const timeResults = Object.entries(timeMap).map(([_time, count]) => ({ _time, count: String(count) })).sort((a, b) => a._time.localeCompare(b._time));
          setTimelineStats(timeResults);
        },
        error: (err) => console.error('Timeline query error:', err)
      });

      // Load hazard flag stats - fetch all, filter on frontend
      const hazardQuery = `index=dwa_inspections sourcetype=inspections | stats count by hazard_flag, asset_id`;
      const hazardJob = SearchJob.create({
        search: hazardQuery,
        earliest_time: '-30d@d',
        latest_time: 'now'
      });
      
      hazardJob.getResults().subscribe({
        next: (data) => {
          let results = data?.results || [];
          // Filter on frontend for non-admin users
          if (!isAdmin() && userSiteNames.length > 0) {
            const lowerSiteNames = userSiteNames.map(s => s.toLowerCase().replace(/\s+/g, '_'));
            results = results.filter(r => {
              const assetId = (r.asset_id || '').toLowerCase();
              return lowerSiteNames.some(site => assetId.includes(site));
            });
          }
          // Group by hazard_flag
          const hazardMap = {};
          results.forEach(r => {
            const flag = r.hazard_flag;
            hazardMap[flag] = (hazardMap[flag] || 0) + (parseInt(r.count) || 0);
          });
          const hazardResults = Object.entries(hazardMap).map(([hazard_flag, count]) => ({ hazard_flag, count: String(count) }));
          setHazardStats(hazardResults);
          setLoading(false);
        },
        error: (err) => {
          console.error('Hazard query error:', err);
          setLoading(false);
        }
      });
      
    } catch (err) {
      setError(err?.message || 'Failed to load analytics');
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading analytics...</div>;
  }

  if (!isAdmin() && userSites.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>No sites assigned to your account. Please contact an administrator.</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: 'clamp(0.75rem, 3vw, 1.25rem)', maxWidth: '100%', overflow: 'hidden' }}>
      <h1 style={{ marginBottom: 'clamp(1rem, 3vw, 1.25rem)', fontSize: 'clamp(1.25rem, 5vw, 1.75rem)' }}>Analytics Dashboard</h1>
      
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
        gap: 'clamp(0.75rem, 2vw, 0.9375rem)', 
        marginBottom: 'clamp(1rem, 3vw, 1.25rem)'
      }}>
        <SummaryCard title="Total Inspections" value={inspectionStats.reduce((sum, r) => sum + (parseInt(r.count) || 0), 0)} color="#3b82f6" />
        <SummaryCard title="Total Check-ins" value={checkinStats.reduce((sum, r) => sum + (parseInt(r.count) || 0), 0)} color="#10b981" />
        <SummaryCard title="Active Inspectors" value={inspectorStats.length} color="#f59e0b" />
        <SummaryCard 
          title="Active Sites" 
          value={new Set([...inspectionStats.map(r => r.asset_id), ...checkinStats.map(r => r.site_name)].filter(Boolean)).size} 
          color="#8b5cf6" 
        />
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
        gap: 'clamp(1rem, 3vw, 1.25rem)', 
        marginBottom: 'clamp(1rem, 3vw, 1.25rem)'
      }}>
        {inspectionStats && inspectionStats.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: 'clamp(0.75rem, 3vw, 0.9375rem)', backgroundColor: '#fff', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>Inspections by Status</h3>
            <InspectionStatusChart data={inspectionStats} />
          </div>
        )}
        
        {inspectorStats && inspectorStats.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: 'clamp(0.75rem, 3vw, 0.9375rem)', backgroundColor: '#fff', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>Inspector Activity</h3>
            <InspectorChart data={inspectorStats} />
          </div>
        )}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
        gap: 'clamp(1rem, 3vw, 1.25rem)', 
        marginBottom: 'clamp(1rem, 3vw, 1.25rem)'
      }}>
        {inspectionStats && inspectionStats.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: 'clamp(0.75rem, 3vw, 0.9375rem)', backgroundColor: '#fff', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>Inspections by Asset</h3>
            <InspectionAssetChart data={inspectionStats} />
          </div>
        )}
        
        {checkinStats && checkinStats.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: 'clamp(0.75rem, 3vw, 0.9375rem)', backgroundColor: '#fff', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>Check-ins by Role</h3>
            <CheckinRoleChart data={checkinStats} />
          </div>
        )}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
        gap: 'clamp(1rem, 3vw, 1.25rem)', 
        alignItems: 'start'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 1.25rem)' }}>
          {checkinStats && checkinStats.length > 0 && (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: 'clamp(0.75rem, 3vw, 0.9375rem)', backgroundColor: '#fff', overflow: 'hidden' }}>
              <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>Check-ins by Site</h3>
              <CheckinSiteChart data={checkinStats} />
            </div>
          )}
          {hazardStats && hazardStats.length > 0 && (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: 'clamp(0.75rem, 3vw, 0.9375rem)', backgroundColor: '#fff', overflow: 'hidden' }}>
              <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>Safety Hazards Detected</h3>
              <HazardChart data={hazardStats} />
            </div>
          )}
        </div>
        
        {timelineStats && timelineStats.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: 'clamp(0.75rem, 3vw, 0.9375rem)', backgroundColor: '#fff', height: '100%', overflow: 'hidden' }}>
            <h3 style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>Inspection Trend (Last 30 Days)</h3>
            <TimelineChart data={timelineStats} />
          </div>
        )}
      </div>
      
      {inspectionStats.length === 0 && checkinStats.length === 0 && inspectorStats.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'clamp(2rem, 5vw, 2.5rem)', color: '#666' }}>
          No data available. Start creating inspections and check-ins to see analytics.
        </div>
      )}
    </div>
  );
};

const InspectionStatusChart = ({ data }) => {
  const statusCounts = {};
  data.forEach(row => {
    const status = (row.status || 'Unknown').charAt(0).toUpperCase() + (row.status || 'Unknown').slice(1).toLowerCase();
    const count = parseInt(row.count) || 0;
    statusCounts[status] = (statusCounts[status] || 0) + count;
  });
  
  const max = Math.max(...Object.values(statusCounts), 1);
  
  return (
    <div>
      {Object.entries(statusCounts).map(([status, count]) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 80, fontSize: 13 }}>{status}</div>
          <div style={{ flex: 1, height: 20, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                background: status === 'Submitted' ? '#3b82f6' : status === 'Approved' ? '#10b981' : '#6366f1',
                transition: 'width 0.3s'
              }}
            />
          </div>
          <div style={{ width: 40, fontSize: 13, textAlign: 'right', fontWeight: 'bold' }}>{String(count)}</div>
        </div>
      ))}
    </div>
  );
};

const InspectionAssetChart = ({ data }) => {
  const assetCounts = {};
  data.forEach(row => {
    const asset = row.asset_id || 'Unknown';
    const count = parseInt(row.count) || 0;
    assetCounts[asset] = (assetCounts[asset] || 0) + count;
  });
  
  const max = Math.max(...Object.values(assetCounts), 1);
  
  return (
    <div>
      {Object.entries(assetCounts).slice(0, 10).map(([asset, count]) => (
        <div key={asset} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 100, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset}</div>
          <div style={{ flex: 1, height: 20, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                background: '#8b5cf6',
                transition: 'width 0.3s'
              }}
            />
          </div>
          <div style={{ width: 40, fontSize: 13, textAlign: 'right', fontWeight: 'bold' }}>{String(count)}</div>
        </div>
      ))}
    </div>
  );
};

const CheckinSiteChart = ({ data }) => {
  const siteCounts = {};
  data.forEach(row => {
    const site = row.site_name || 'Unknown';
    const count = parseInt(row.count) || 0;
    siteCounts[site] = (siteCounts[site] || 0) + count;
  });
  
  const max = Math.max(...Object.values(siteCounts), 1);
  
  return (
    <div>
      {Object.entries(siteCounts).slice(0, 10).map(([site, count]) => (
        <div key={site} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 100, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site}</div>
          <div style={{ flex: 1, height: 20, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                background: '#f59e0b',
                transition: 'width 0.3s'
              }}
            />
          </div>
          <div style={{ width: 40, fontSize: 13, textAlign: 'right', fontWeight: 'bold' }}>{String(count)}</div>
        </div>
      ))}
    </div>
  );
};

const CheckinRoleChart = ({ data }) => {
  const roleCounts = {};
  data.forEach(row => {
    const role = row.user_role || 'Unknown';
    const count = parseInt(row.count) || 0;
    roleCounts[role] = (roleCounts[role] || 0) + count;
  });
  
  const max = Math.max(...Object.values(roleCounts), 1);
  
  return (
    <div>
      {Object.entries(roleCounts).map(([role, count]) => (
        <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 80, fontSize: 13 }}>{role}</div>
          <div style={{ flex: 1, height: 20, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                background: '#10b981',
                transition: 'width 0.3s'
              }}
            />
          </div>
          <div style={{ width: 40, fontSize: 13, textAlign: 'right', fontWeight: 'bold' }}>{String(count)}</div>
        </div>
      ))}
    </div>
  );
};

const InspectorChart = ({ data }) => {
  const sorted = [...data].sort((a, b) => (parseInt(b.count) || 0) - (parseInt(a.count) || 0)).slice(0, 10);
  const max = Math.max(...sorted.map(r => parseInt(r.count) || 0), 1);
  
  return (
    <div>
      {sorted.map(row => (
        <div key={row.inspector} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 100, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.inspector || 'Unknown'}</div>
          <div style={{ flex: 1, height: 20, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(parseInt(row.count) / max) * 100}%`,
                background: '#f59e0b',
                transition: 'width 0.3s'
              }}
            />
          </div>
          <div style={{ width: 40, fontSize: 13, textAlign: 'right', fontWeight: 'bold' }}>{String(row.count)}</div>
        </div>
      ))}
    </div>
  );
};

const TimelineChart = ({ data }) => {
  const filteredData = data.filter(r => parseInt(r.count) > 0);
  const max = Math.max(...data.map(r => parseInt(r.count) || 0), 1);
  
  if (filteredData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>No inspection activity in the last 30 days</div>;
  }
  
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, padding: '10px 0' }}>
        {data.slice(-14).map((row, idx) => {
          const count = parseInt(row.count) || 0;
          const height = Math.max((count / max) * 100, count > 0 ? 5 : 0);
          const date = row._time ? new Date(row._time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {count > 0 && (
                <div style={{ fontSize: 11, fontWeight: 'bold', color: '#3b82f6' }}>{count}</div>
              )}
              <div
                title={`${date}: ${count} inspection${count !== 1 ? 's' : ''}`}
                style={{
                  width: '100%',
                  height: `${height}%`,
                  background: count > 0 ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)' : '#e5e7eb',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  boxShadow: count > 0 ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              />
              {date && (
                <div style={{ fontSize: 9, color: '#666', transform: 'rotate(-45deg)', marginTop: 8, whiteSpace: 'nowrap' }}>
                  {date}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HazardChart = ({ data }) => {
  const hazardCounts = { safe: 0, hazard: 0 };
  data.forEach(row => {
    const flag = row.hazard_flag;
    const count = parseInt(row.count) || 0;
    if (flag === 'true' || flag === true || flag === '1' || flag === 1) {
      hazardCounts.hazard += count;
    } else {
      hazardCounts.safe += count;
    }
  });
  
  const total = hazardCounts.safe + hazardCounts.hazard;
  const hazardPercent = total > 0 ? ((hazardCounts.hazard / total) * 100).toFixed(1) : 0;
  
  return (
    <div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '20px', background: '#fef2f2', borderRadius: '8px', border: '2px solid #fca5a5' }}>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: '#dc2626' }}>{hazardCounts.hazard}</div>
          <div style={{ fontSize: 13, color: '#991b1b', marginTop: 4 }}>Hazards Detected</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: '20px', background: '#f0fdf4', borderRadius: '8px', border: '2px solid #86efac' }}>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: '#16a34a' }}>{hazardCounts.safe}</div>
          <div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>Safe Inspections</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '12px', background: hazardPercent > 20 ? '#fef2f2' : '#f0fdf4', borderRadius: '6px' }}>
        <div style={{ fontSize: 14, color: '#666' }}>Hazard Rate</div>
        <div style={{ fontSize: 28, fontWeight: 'bold', color: hazardPercent > 20 ? '#dc2626' : '#16a34a' }}>{hazardPercent}%</div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, color }) => (
  <div style={{ 
    border: '1px solid #ddd', 
    borderRadius: '8px', 
    padding: '20px', 
    backgroundColor: '#fff',
    borderLeft: `4px solid ${color}`
  }}>
    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{title}</div>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>{value}</div>
  </div>
);

export default AnalyticsDashboard;