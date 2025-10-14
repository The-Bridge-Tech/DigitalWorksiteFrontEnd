import React, { useState, useEffect } from 'react';
import { useSite } from '../SiteContext';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';

const SubcontractorDashboard = () => {
    const { selectedSite, hasPermission } = useSite();
    const [subcontractors, setSubcontractors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());

    const fetchSubcontractors = async () => {
        if (!selectedSite) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `${API_BASE_URL}${API_ENDPOINTS.SITE_SUBCONTRACTORS(selectedSite.id)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setSubcontractors(data.subcontractors || []);
            }
        } catch (error) {
            console.error('Error fetching subcontractors:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (subcontractorId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(subcontractorId)) {
            newExpanded.delete(subcontractorId);
        } else {
            newExpanded.add(subcontractorId);
        }
        setExpandedRows(newExpanded);
    };

    useEffect(() => {
        fetchSubcontractors();
    }, [selectedSite]);

    if (!selectedSite) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                Please select a site to view subcontractors.
            </div>
        );
    }

    if (!hasPermission('view_reports')) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545' }}>
                You don't have permission to view subcontractor information.
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Subcontractors - {selectedSite.name}</h2>
                <button 
                    onClick={fetchSubcontractors}
                    style={{
                        padding: '8px 16px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div>Loading subcontractors...</div>
            ) : subcontractors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No subcontractors found for this site.
                </div>
            ) : (
                <div>
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
                        <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
                            <strong>Total Subcontractors:</strong> {subcontractors.length}
                        </div>
                        <div style={{ padding: '15px', background: '#e8f5e8', borderRadius: '8px' }}>
                            <strong>Active Permits:</strong> {subcontractors.reduce((sum, s) => sum + s.active_permits, 0)}
                        </div>
                        <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
                            <strong>Total Check-ins:</strong> {subcontractors.reduce((sum, s) => sum + s.total_checkins, 0)}
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                                <th style={tableHeaderStyle}>Name</th>
                                <th style={tableHeaderStyle}>Company</th>
                                <th style={tableHeaderStyle}>Role</th>
                                <th style={tableHeaderStyle}>Check-ins</th>
                                <th style={tableHeaderStyle}>Active Permits</th>
                                <th style={tableHeaderStyle}>Last Visit</th>
                                <th style={tableHeaderStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subcontractors.map((item) => (
                                <React.Fragment key={item.subcontractor.id}>
                                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={tableCellStyle}>{item.subcontractor.name}</td>
                                        <td style={tableCellStyle}>{item.subcontractor.company || 'N/A'}</td>
                                        <td style={tableCellStyle}>
                                            <span style={{
                                                padding: '4px 8px',
                                                background: getRoleColor(item.subcontractor.role),
                                                color: 'white',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {item.subcontractor.role}
                                            </span>
                                        </td>
                                        <td style={tableCellStyle}>{item.total_checkins}</td>
                                        <td style={tableCellStyle}>{item.active_permits}</td>
                                        <td style={tableCellStyle}>
                                            {item.last_checkin ? new Date(item.last_checkin).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td style={tableCellStyle}>
                                            <button
                                                onClick={() => toggleRow(item.subcontractor.id)}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                {expandedRows.has(item.subcontractor.id) ? 'Hide Details' : 'Show Details'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRows.has(item.subcontractor.id) && (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '15px', background: '#f8f9fa' }}>
                                                <SubcontractorDetails data={item} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const SubcontractorDetails = ({ data }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
                <h4>Contact Information</h4>
                <p><strong>Email:</strong> {data.subcontractor.contact_email || 'N/A'}</p>
                <p><strong>Phone:</strong> {data.subcontractor.contact_phone || 'N/A'}</p>
                <p><strong>License:</strong> {data.subcontractor.license_number || 'N/A'}</p>
            </div>
            
            <div>
                <h4>Recent Check-ins</h4>
                {data.checkins.slice(0, 3).map((checkin, index) => (
                    <div key={index} style={{ marginBottom: '5px', fontSize: '12px' }}>
                        {new Date(checkin.timestamp).toLocaleString()}
                    </div>
                ))}
                {data.checkins.length > 3 && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        +{data.checkins.length - 3} more check-ins
                    </div>
                )}
            </div>
            
            <div>
                <h4>Documents & Permits</h4>
                {data.documents.slice(0, 3).map((doc, index) => (
                    <div key={index} style={{ marginBottom: '5px', fontSize: '12px' }}>
                        <span style={{
                            padding: '2px 6px',
                            background: doc.status === 'approved' ? '#28a745' : '#ffc107',
                            color: 'white',
                            borderRadius: '3px',
                            marginRight: '5px'
                        }}>
                            {doc.status}
                        </span>
                        {doc.name}
                    </div>
                ))}
                {data.documents.length > 3 && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        +{data.documents.length - 3} more documents
                    </div>
                )}
            </div>
        </div>
    );
};

const getRoleColor = (role) => {
    const colors = {
        'Electrical': '#ffc107',
        'Mechanical': '#17a2b8',
        'Plumber': '#007bff',
        'Framer': '#28a745'
    };
    return colors[role] || '#6c757d';
};

const tableHeaderStyle = {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold'
};

const tableCellStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee'
};

export default SubcontractorDashboard;