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
                        return data.filter(assignment => assignment.user_email === user.email).map(assignment => ({
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
            console.log('Fetched user assignments:', userAssignments);
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
            
            console.log('Assigning user to site with role:', selectedRole);
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
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header Card */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                marginBottom: '30px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '24px' }}>
                            🎯 Site Assignments for {user.displayName || user.name}
                        </h3>
                        <p style={{ margin: 0, color: '#6c757d', fontSize: '16px' }}>
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
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
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
                padding: '30px',
                borderRadius: '12px',
                marginBottom: '30px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
            }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Assign to New Site</h4>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>
                            Site:
                        </label>
                        <select
                            value={selectedSite}
                            onChange={(e) => setSelectedSite(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                fontSize: '14px'
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
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>
                            Role:
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                fontSize: '14px'
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
                            padding: '10px 20px',
                            backgroundColor: selectedSite ? '#28a745' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedSite ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: '500'
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
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {assignments.map((assignment) => {
                            const site = sites.find(s => s.id === assignment.site_id);
                            return (
                                <div
                                    key={`${assignment.site_id}-${assignment.user_email}`}
                                    style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #e9ecef',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <h5 style={{ margin: '0 0 5px 0', color: '#495057' }}>
                                            {site?.name || 'Unknown Site'}
                                        </h5>
                                        <p style={{ margin: '0 0 5px 0', color: '#6c757d', fontSize: '14px' }}>
                                            📍 {site?.location || 'Unknown Location'}
                                        </p>
                                        <span style={{
                                            padding: '4px 8px',
                                            backgroundColor: getRoleColor(assignment.role),
                                            color: 'white',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            {assignment.role.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <small style={{ color: '#6c757d' }}>
                                            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                                        </small>
                                        <button
                                            onClick={() => removeAssignment(assignment.site_id)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
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
    const colors = {
        admin: '#dc3545',
        site_manager: '#007bff',
        contractor: '#28a745',
        subcontractor: '#ffc107',
        inspector: '#17a2b8',
        viewer: '#6c757d'
    };
    return colors[role] || '#6c757d';
};

export default SiteAssignments;