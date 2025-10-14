import React, { useState, useEffect } from 'react';
import { getUsers } from '../../services/users.service';
import UserForm from './UserForm';
import SiteAssignments from './SiteAssignments';
import { useSite } from '../SiteContext';
import { API_BASE_URL } from '../../config/api.config';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('list'); // list, form, assignments, activities
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterRole, setFilterRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sites, setSites] = useState([]);
    const [userAssignments, setUserAssignments] = useState({});

    const { selectedSite, hasPermission } = useSite();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);
            

            
            // Load sites first (faster)
            const sitesData = await fetch(`${API_BASE_URL}/adm/sites`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            }).then(res => res.ok ? res.json() : []);
            
            setSites(sitesData || []);
            
            // Load users with progress updates
            const userData = await getUsers(null, forceRefresh);
            setUsers(userData || []);
            
            // Load assignments in background (non-blocking)
            loadUserAssignments(userData || [], sitesData || []).catch(err => {
                console.warn('Failed to load some user assignments:', err);
            });
            
        } catch (err) {
            console.error('Error loading users:', err);
            setError(`Failed to load users: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Quick refresh - only updates users, keeps existing data
    const quickRefresh = async () => {
        try {
            setLoading(true);
            const userData = await getUsers(null, true); // Force refresh users only
            setUsers(userData || []);
        } catch (err) {
            console.error('Quick refresh failed:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const loadUserAssignments = async (userList, siteList) => {
        try {
            const assignments = {};
            const token = localStorage.getItem('auth_token');
            
            // For each site, get user assignments
            for (const site of siteList) {
                try {
                    // Get Splunk roles for API call
                    const headers = {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    };
                    
                    // Add Splunk roles header
                    try {
                        if (window.$C && window.$C.USERNAME) {
                            const xhr = new XMLHttpRequest();
                            xhr.open('GET', '/splunkd/services/authentication/current-context?output_mode=json', false);
                            xhr.setRequestHeader('Accept', 'application/json');
                            xhr.send();
                            
                            if (xhr.status === 200) {
                                const response = JSON.parse(xhr.responseText);
                                const roles = response?.entry?.[0]?.content?.roles || [];
                                const userRoles = Array.isArray(roles) ? roles : [roles];
                                headers['X-Splunk-Roles'] = userRoles.join(',');
                            }
                        }
                    } catch (splunkError) {
                        console.log('Splunk context not available for user assignments');
                    }
                    
                    const response = await fetch(`${API_BASE_URL}/api/sites/${site.id}/users`, {
                        headers
                    });
                    
                    if (response.ok) {
                        const siteAssignments = await response.json();
                        siteAssignments.forEach(assignment => {
                            if (!assignments[assignment.user_email]) {
                                assignments[assignment.user_email] = [];
                            }
                            assignments[assignment.user_email].push({
                                site: site,
                                role: assignment.role,
                                assigned_at: assignment.assigned_at
                            });
                        });
                    }
                } catch (err) {
                    console.warn(`Failed to load assignments for site ${site.name}:`, err);
                }
            }
            
            setUserAssignments(assignments);
        } catch (err) {
            console.error('Error loading user assignments:', err);
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setActiveTab('assignments');
    };

    const handleNewUser = () => {
        setSelectedUser(null);
        setActiveTab('form');
    };

    const handleEditUser = (user) => {
        // Only allow editing database users, not Google Drive users
        if (user.id && !user.id.includes('-') && !user.fileId) {
            setSelectedUser(user);
            setActiveTab('form');
        } else {
            alert('Cannot edit Google Drive users. Only database users can be edited.');
        }
    };

    const handleFormComplete = () => {
        setActiveTab('list');
        setSelectedUser(null);
        // Quick refresh without clearing cache for better performance
        setTimeout(() => {
            quickRefresh();
        }, 2000);
    };
    
    const handleBackToUsers = () => {
        setActiveTab('list');
        setSelectedUser(null);
        // No need to reload - use existing cached data
    };

    const filteredUsers = users.filter(user => {
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesSearch = !searchTerm || 
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.company?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Admin users see all users regardless of site selection
        return matchesRole && matchesSearch;
    });

    const renderTabContent = () => {
        switch (activeTab) {
            case 'form':
                return (
                    <UserForm
                        userId={selectedUser?.id}
                        onSave={handleFormComplete}
                        onCancel={() => setActiveTab('list')}
                    />
                );
            
            case 'assignments':
                return (
                    <SiteAssignments
                        user={selectedUser}
                        onUpdate={loadUsers}
                    />
                );
            
            case 'activities':
                return (
                    <UserActivities user={selectedUser} />
                );
            
            default:
                return renderUserList();
        }
    };

    const renderUserList = () => (
        <div>
            {/* Search and Filters Card */}

            {/* Filters */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                marginBottom: '25px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
            }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr auto', 
                    gap: window.innerWidth <= 768 ? '15px' : '20px', 
                    alignItems: 'end'
                }}>
                    <div>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            color: '#495057', 
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            Search Users
                        </label>
                        <input
                            type="text"
                            placeholder="🔍 Search by name, email, or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9ecef',
                                borderRadius: '8px',
                                fontSize: '14px',
                                transition: 'border-color 0.3s ease',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                        />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            color: '#495057', 
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            Filter by Role
                        </label>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e9ecef',
                                borderRadius: '8px',
                                fontSize: '14px',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="site_manager">Site Manager</option>
                            <option value="contractor">Contractor</option>
                            <option value="subcontractor">Subcontractor</option>
                            <option value="inspector">Inspector</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '15px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb'
                }}>
                    {error}
                </div>
            )}

            {/* Users Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    Loading users...
                </div>
            ) : filteredUsers.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    color: '#666'
                }}>
                    {searchTerm || filterRole !== 'all' ? 'No users match your filters' : 'No users found'}
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredUsers.map(user => (
                        <UserCard
                            key={user.email}
                            user={user}
                            onSelect={() => handleUserSelect(user)}
                            onEdit={() => handleEditUser(user)}
                            hasPermission={hasPermission}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ padding: '20px' }}>
            {/* Header Card - Only show on main list view */}
            {activeTab === 'list' && (
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    padding: '30px',
                    marginBottom: '30px',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>
                                👥 User Management
                            </h1>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
                                Manage all users, roles, and site assignments across your construction sites
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>


                            <button
                                onClick={quickRefresh}
                                disabled={loading}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(10px)',
                                    fontSize: '14px',
                                    opacity: loading ? 0.6 : 1
                                }}
                                title="Quick refresh users (uses cache when possible)"
                            >
                                {loading ? '⚡ Refreshing...' : '🔄 Refresh'}
                            </button>
                            <button
                                onClick={handleNewUser}
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    padding: '12px 24px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(10px)',
                                    fontSize: '16px'
                                }}
                            >
                                ➕ Add New User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            {activeTab !== 'list' && (
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    padding: '20px 30px',
                    marginBottom: '30px',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            onClick={handleBackToUsers}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '10px 20px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            ← Back to Users
                        </button>
                        {selectedUser && (
                            <>
                                <button
                                    onClick={() => setActiveTab('assignments')}
                                    style={{
                                        backgroundColor: activeTab === 'assignments' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        padding: '10px 20px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    Site Assignments
                                </button>
                                <button
                                    onClick={() => setActiveTab('activities')}
                                    style={{
                                        backgroundColor: activeTab === 'activities' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        padding: '10px 20px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    Activities
                                </button>
                            </>
                        )}
                        {selectedUser && (
                            <div style={{ marginLeft: 'auto', opacity: 0.9 }}>
                                <span style={{ fontSize: '16px', fontWeight: '500' }}>
                                    {selectedUser.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {renderTabContent()}
            

        </div>
    );
};

const UserCard = ({ user, onSelect, onEdit, hasPermission }) => (
    <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }}>
        
        {/* User Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: getRoleColor(user.role),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                marginRight: '15px'
            }}>
                {getRoleIcon(user.role)}
            </div>
            <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#495057' }}>
                    {user.name}
                </h3>
                <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                    {user.email}
                </p>
            </div>
        </div>

        {/* User Details */}
        <div style={{ marginBottom: '15px' }}>
            <div style={{ marginBottom: '8px' }}>
                <span style={{
                    padding: '4px 8px',
                    backgroundColor: getRoleColor(user.role),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                }}>
                    {(user.role || 'USER').replace(/^dwa_/i, '').replace(/_/g, ' ').toUpperCase()}
                </span>
                {user.subcontractor_type && (
                    <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        marginLeft: '8px'
                    }}>
                        {user.subcontractor_type}
                    </span>
                )}
            </div>
            <p style={{ margin: '5px 0', color: '#495057', fontSize: '14px' }}>
                🏢 {user.company || 'No company'}
            </p>
            {user.contact_phone && (
                <p style={{ margin: '5px 0', color: '#495057', fontSize: '14px' }}>
                    📞 {user.contact_phone}
                </p>
            )}
            {user.license_number && (
                <p style={{ margin: '5px 0', color: '#495057', fontSize: '14px' }}>
                    📋 License: {user.license_number}
                </p>
            )}
            
            {/* Site Assignments - Use user.site_assignments from backend */}
            {user.site_assignments && user.site_assignments.length > 0 ? (
                <div style={{ marginTop: '10px' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#495057', fontSize: '12px', fontWeight: '600' }}>
                        🏗️ Assigned Sites:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {user.site_assignments.slice(0, 2).map((assignment, index) => (
                            <span
                                key={index}
                                style={{
                                    padding: '2px 6px',
                                    backgroundColor: '#e9ecef',
                                    color: '#495057',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                }}
                                title={`${assignment.site_name} - ${assignment.site_location}`}
                            >
                                {assignment.site_name}
                            </span>
                        ))}
                        {user.site_assignments.length > 2 && (
                            <span style={{
                                padding: '2px 6px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '500'
                            }}>
                                +{user.site_assignments.length - 2} more
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <p style={{ margin: '10px 0 0 0', color: '#6c757d', fontSize: '12px', fontStyle: 'italic' }}>
                    🚫 No site assignments
                </p>
            )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
            <button
                onClick={onSelect}
                style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                }}
            >
                Manage Sites
            </button>
            <button
                onClick={onEdit}
                style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                }}
            >
                Edit
            </button>
        </div>
    </div>
);

const UserActivities = ({ user }) => (
    <div style={{ padding: '20px' }}>
        <h3>User Activities for {user?.name}</h3>
        <p style={{ color: '#666' }}>
            Activity tracking will be implemented here - check-ins, documents, inspections, etc.
        </p>
    </div>
);

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

const getRoleIcon = (role) => {
    const icons = {
        admin: '👑',
        site_manager: '🏗️',
        contractor: '👷',
        subcontractor: '🔧',
        inspector: '🔍',
        viewer: '👁️'
    };
    return icons[role] || '👤';
};

export default UserManagement;