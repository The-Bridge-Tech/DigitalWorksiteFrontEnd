import React from 'react';
import { useSite } from '../SiteContext';

const SiteSelector = () => {
    const { selectedSite, userSites, userRole, loading, selectSite, isAdmin } = useSite();

    if (loading) {
        return <div>Loading...</div>;
    }

    // Admin users see a simple admin indicator instead of site selector
    if (isAdmin()) {
        return (
            <div style={{ 
                padding: '12px 20px', 
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', 
                color: 'white',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center'
            }}>
                <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                }}>
                    👑 ADMIN ACCESS
                </div>
            </div>
        );
    }

    if (userSites.length === 0) {
        return (
            <div style={{ padding: '12px 20px', background: '#f8d7da', color: '#721c24', textAlign: 'center' }}>
                No sites assigned. Contact your administrator.
            </div>
        );
    }

    return (
        <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {selectedSite ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: '600', color: '#495057' }}>Current Site:</span>
                            <span style={{ 
                                padding: '8px 12px',
                                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                {selectedSite.name} - {selectedSite.location}
                            </span>
                        </div>
                    ) : (
                        <>
                            <label htmlFor="site-select" style={{ fontWeight: '600', color: '#495057' }}>
                                Select Site:
                            </label>
                            <select
                                id="site-select"
                                value={selectedSite?.id || ''}
                                onChange={(e) => {
                                    const site = userSites.find(s => s.id === e.target.value);
                                    if (site) selectSite(site);
                                }}
                                style={{
                                    padding: '8px 12px',
                                    border: '2px solid #e9ecef',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    minWidth: '250px',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="">Select a site...</option>
                                {userSites.map(site => (
                                    <option key={site.id} value={site.id}>
                                        {site.name} - {site.location}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
                {userRole && (
                    <div style={{ 
                        padding: '6px 12px', 
                        background: getRoleColor(userRole), 
                        color: 'white', 
                        borderRadius: '20px', 
                        fontSize: '12px',
                        fontWeight: '600'
                    }}>
                        {userRole?.toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    );
};

const getRoleColor = (role) => {
    const colors = {
        admin: '#dc3545',
        site_manager: '#007bff',
        contractor: '#28a745',
        inspector: '#ffc107',
        viewer: '#6c757d'
    };
    return colors[role] || '#6c757d';
};

export default SiteSelector;