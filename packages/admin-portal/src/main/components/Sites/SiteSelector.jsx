import React from 'react';
import { useSite } from '../SiteContext';
import { theme, getRoleColor } from '../../theme/colors';

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
                background: theme.gradients.secondary2, 
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
                    👑 ADMIN ACCESS - All Sites
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
        <div style={{ padding: '12px 20px', background: theme.neutral.light, borderBottom: '1px solid #e9ecef' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: '600', color: theme.neutral.dark }}>Your Sites:</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {userSites.map(site => (
                            <span key={site.id} style={{ 
                                padding: '8px 12px',
                                background: theme.gradients.primary,
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                {site.name} - {site.location}
                            </span>
                        ))}
                    </div>
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


export default SiteSelector;