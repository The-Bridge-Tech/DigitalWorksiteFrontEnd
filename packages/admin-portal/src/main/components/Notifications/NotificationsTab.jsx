import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api.config.js';

const NotificationsTab = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data || []);
            } else {
                setNotifications([]);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`${API_BASE_URL}/notifications/${notificationId}/mark_read`, {
                method: 'POST',
                credentials: 'include'
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'inspection': return '📋';
            case 'safety': return '⚠️';
            case 'overdue': return '🔴';
            case 'reminder': return '⏰';
            default: return '📢';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'safety': return '#dc3545';
            case 'overdue': return '#fd7e14';
            case 'inspection': return '#007bff';
            case 'reminder': return '#28a745';
            default: return '#6c757d';
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                Loading notifications...
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            {/* Header Card */}
            <div style={{
                background: 'linear-gradient(135deg, #fd7e14 0%, #e55a4e 100%)',
                borderRadius: '12px',
                padding: '30px',
                marginBottom: '30px',
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>
                    🔔 Notifications
                </h1>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
                    Stay updated with important alerts, reminders, and system notifications
                </p>
            </div>
            
            {notifications.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    color: '#6c757d',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <h3>No notifications</h3>
                    <p>You're all caught up! New notifications will appear here.</p>
                </div>
            ) : (
                <div>
                    <div style={{ marginBottom: '20px', color: '#6c757d' }}>
                        {notifications.filter(n => n.status === 'unread').length} unread of {notifications.length} total
                    </div>
                    
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            style={{
                                border: '1px solid #dee2e6',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '12px',
                                backgroundColor: notification.status === 'unread' ? '#f8f9ff' : 'white',
                                borderLeft: `4px solid ${getTypeColor(notification.type)}`,
                                cursor: notification.status === 'unread' ? 'pointer' : 'default'
                            }}
                            onClick={() => notification.status === 'unread' && markAsRead(notification.id)}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ fontSize: '24px' }}>
                                    {getTypeIcon(notification.type)}
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ 
                                            margin: '0 0 8px 0', 
                                            color: getTypeColor(notification.type),
                                            fontWeight: notification.status === 'unread' ? 'bold' : 'normal'
                                        }}>
                                            {notification.title || `${notification.type} notification`}
                                        </h4>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {notification.status === 'unread' && (
                                                <span style={{
                                                    backgroundColor: '#007bff',
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    NEW
                                                </span>
                                            )}
                                            <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                                {new Date(notification.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p style={{ 
                                        margin: '0 0 8px 0', 
                                        color: '#495057',
                                        lineHeight: '1.4'
                                    }}>
                                        {notification.body}
                                    </p>
                                    
                                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                        <span style={{
                                            backgroundColor: '#e9ecef',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            marginRight: '8px'
                                        }}>
                                            {notification.type.toUpperCase()}
                                        </span>
                                        To: {Array.isArray(notification.recipients) ? notification.recipients.join(', ') : notification.recipients}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsTab;