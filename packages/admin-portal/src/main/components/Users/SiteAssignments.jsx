import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';

const SiteAssignments = ({ user, onUpdate, onCancel }) => {
    const [sites, setSites] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSite, setSelectedSite] = useState('');
    const [selectedRole, setSelectedRole] = useState('contractor');

    useEffect(() => {
        fetchSites();
    }, [user]);
    
    useEffect(() => {
        if (sites.length > 0) {
            fetchUserAssignments();
        }
    }, [sites, user]);

    const fetchSites = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SITES}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSites(data);
            }
        } catch (error) {
            console.error('Error fetching sites:', error);
        }
    };

    const fetchUserAssignments = async () => {
        if (!user?.email || sites.length === 0) return;
        
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            
            // Get assignments for this user across all sites
            const assignmentPromises = sites.map(async (site) => {
                try {
                    const headers = {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    };
                    
                    // Add Splunk user context
                    const splunkUser = window.$C?.USERNAME || 'admin';
                    const splunkRoles = window.$C?.ROLES || ['dwa_admin'];
                    headers['X-Splunk-Username'] = splunkUser;
                    headers['X-Splunk-Roles'] = Array.isArray(splunkRoles) ? splunkRoles.join(',') : splunkRoles;
                    
                    const response = await fetch(`${API_BASE_URL}/api/sites/${site.id}/users`, {
                        headers
                    });
                    if (response.ok) {
                        const data = await response.json();
                        return data.filter(assignment => assignment.email === user.email).map(assignment => ({
                            ...assignment,
                            site_name: site.name,
                            site_location: site.location
                        }));
                    }
                } catch (error) {
                    console.warn(`Failed to fetch assignments for site ${site.id}:`, error);
                }
                return [];
            });

            const results = await Promise.all(assignmentPromises);
            const userAssignments = results.flat();
            setAssignments(userAssignments);
        } catch (error) {
            console.error('Error fetching user assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const assignToSite = async () => {
        if (!selectedSite || !user?.email) return;

        try {
            const token = localStorage.getItem('auth_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            // Add Splunk user context
            const splunkUser = window.$C?.USERNAME || 'admin';
            const splunkRoles = window.$C?.ROLES || ['dwa_admin'];
            headers['X-Splunk-Username'] = splunkUser;
            headers['X-Splunk-Roles'] = Array.isArray(splunkRoles) ? splunkRoles.join(',') : splunkRoles;
            
            const response = await fetch(`${API_BASE_URL}/api/sites/${selectedSite}/users`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    user_email: user.email,  // Use email for user identification
                    role: selectedRole
                })
            });

            if (response.ok) {
                await fetchUserAssignments();
                setSelectedSite('');
                setSelectedRole('contractor');
                if (onUpdate) onUpdate();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to assign user to site');
            }
        } catch (error) {
            console.error('Error assigning user to site:', error);
            alert('Failed to assign user to site');
        }
    };

    const removeAssignment = async (siteId) => {
        if (!window.confirm('Remove this site assignment?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            // Add Splunk user context
            const splunkUser = window.$C?.USERNAME || 'admin';
            const splunkRoles = window.$C?.ROLES || ['dwa_admin'];
            headers['X-Splunk-Username'] = splunkUser;
            headers['X-Splunk-Roles'] = Array.isArray(splunkRoles) ? splunkRoles.join(',') : splunkRoles;
            
            const response = await fetch(`${API_BASE_URL}/api/sites/${siteId}/users`, {
                method: 'DELETE',
                headers,
                body: JSON.stringify({
                    user_email: user.email  // Use email for user identification
                })
            });

            if (response.ok) {
                await fetchUserAssignments();
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Error removing assignment:', error);
        }
    };

    if (!user) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Select a user to manage site assignments
            </div>
        );
    }

    return (
        <div style={{ padding: 'clamp(0.75rem, 3vw, 1.25rem)', maxWidth: '100%', margin: '0 auto', overflow: 'hidden' }}>
            {/* Header Card */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: 'clamp(1.5rem, 4vw, 1.875rem)',
                marginBottom: 'clamp(1.5rem, 4vw, 1.875rem)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', gap: 'clamp(0.75rem, 3vw, 1rem)' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
                            🎯 Site Assignments for {user.displayName || user.name}
                        </h3>
                        <p style={{ margin: 0, color: '#6c757d', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                            Manage which sites this user can access and their role at each site
                        </p>
                    </div>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: 'clamp(0.5rem, 2vw, 0.5rem) clamp(0.75rem, 3vw, 1rem)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                                whiteSpace: 'nowrap',
                                minHeight: '44px'
                            }}
                        >
                            ← Back to Users
                        </button>
                    )}
                </div>
            </div>

            {/* Add New Assignment */}
            <div style={{
                backgroundColor: 'white',
                padding: 'clamp(1.5rem, 4vw, 1.875rem)',
                borderRadius: '12px',
                marginBottom: 'clamp(1.5rem, 4vw, 1.875rem)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                overflow: 'hidden'
            }}>
                <h4 style={{ margin: '0 0 clamp(0.75rem, 3vw, 0.9375rem) 0', color: '#495057', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>Assign to New Site</h4>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                    gap: 'clamp(0.75rem, 3vw, 0.9375rem)', 
                    alignItems: window.innerWidth < 768 ? 'stretch' : 'end'
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={{ display: 'block', marginBottom: '0.3125rem', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', fontWeight: '600' }}>
                            Site:
                        </label>
                        <select
                            value={selectedSite}
                            onChange={(e) => setSelectedSite(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 'clamp(0.5rem, 2vw, 0.625rem)',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                                minHeight: '40px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="">Select a site...</option>
                            {sites.filter(site => 
                                !assignments.some(assignment => assignment.site_id === site.id)
                            ).map(site => (
                                <option key={site.id} value={site.id}>
                                    {site.name} - {site.location}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <label style={{ display: 'block', marginBottom: '0.3125rem', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', fontWeight: '600' }}>
                            Role:
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 'clamp(0.5rem, 2vw, 0.625rem)',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                                minHeight: '40px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="contractor">Contractor</option>
                            <option value="subcontractor">Subcontractor</option>
                            <option value="site_manager">Site Manager</option>
                            <option value="inspector">Inspector</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <button
                        onClick={assignToSite}
                        disabled={!selectedSite}
                        style={{
                            padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.75rem, 3vw, 1.25rem)',
                            backgroundColor: selectedSite ? '#28a745' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedSite ? 'pointer' : 'not-allowed',
                            fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                            fontWeight: '500',
                            minHeight: '44px',
                            whiteSpace: 'nowrap',
                            minWidth: window.innerWidth < 768 ? '100%' : 'auto'
                        }}
                    >
                        Assign
                    </button>
                </div>
            </div>

            {/* Current Assignments */}
            <div>
                <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Current Site Assignments</h4>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        Loading assignments...
                    </div>
                ) : assignments.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        color: '#666'
                    }}>
                        No site assignments yet. Assign this user to sites above.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 'clamp(0.75rem, 3vw, 0.9375rem)' }}>
                        {assignments.map((assignment) => {
                            const site = sites.find(s => s.id === assignment.site_id);
                            return (
                                <div
                                    key={`${assignment.site_id}-${assignment.user_email}`}
                                    style={{
                                        backgroundColor: 'white',
                                        padding: 'clamp(1rem, 4vw, 1.25rem)',
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef',
                                        display: 'flex',
                                        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                                        justifyContent: 'space-between',
                                        alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
                                        gap: 'clamp(0.5rem, 2vw, 0.625rem)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h5 style={{ margin: '0 0 0.3125rem 0', color: '#495057', fontSize: 'clamp(1rem, 4vw, 1.125rem)', wordBreak: 'break-word' }}>
                                            {site?.name || 'Unknown Site'}
                                        </h5>
                                        <p style={{ margin: '0 0 0.3125rem 0', color: '#6c757d', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', wordBreak: 'break-word' }}>
                                            📍 {site?.location || 'Unknown Location'}
                                        </p>
                                        <span style={{
                                            padding: 'clamp(0.25rem, 1vw, 0.25rem) clamp(0.5rem, 2vw, 0.5rem)',
                                            backgroundColor: getRoleColor(assignment.role),
                                            color: 'white',
                                            borderRadius: '12px',
                                            fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                                            fontWeight: '500',
                                            display: 'inline-block'
                                        }}>
                                            {(assignment.role || '').replace(/^dwa_/i, '').replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                                        alignItems: window.innerWidth < 768 ? 'stretch' : 'center', 
                                        gap: 'clamp(0.5rem, 2vw, 0.625rem)'
                                    }}>
                                        <small style={{ color: '#6c757d', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)', whiteSpace: 'nowrap' }}>
                                            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                                        </small>
                                        <button
                                            onClick={() => removeAssignment(assignment.site_id)}
                                            style={{
                                                padding: 'clamp(0.375rem, 1.5vw, 0.375rem) clamp(0.75rem, 3vw, 0.75rem)',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                                                minHeight: '32px',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const getRoleColor = (role) => {
    // Strip dwa_ prefix if present
    const cleanRole = (role || '').replace(/^dwa_/i, '').toLowerCase();
    const colors = {
        admin: '#dc3545',
        site_manager: '#007bff',
        contractor: '#28a745',
        subcontractor: '#ffc107',
        inspector: '#17a2b8',
        viewer: '#6c757d'
    };
    return colors[cleanRole] || '#6c757d';
};

export default SiteAssignments;