import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config.js';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS}/`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data || []);
                setUnreadCount((data || []).filter(n => n.status === 'unread').length);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATION_MARK_READ(notificationId)}`, {
                method: 'POST',
                credentials: 'include'
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    position: 'relative'
                }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: 'red',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    background: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    width: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                        Notifications ({unreadCount} unread)
                    </div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            No notifications
                        </div>
                    ) : (
                        notifications.slice(0, 10).map(notification => (
                            <div 
                                key={notification.id}
                                style={{
                                    padding: '10px',
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: notification.status === 'unread' ? '#f0f8ff' : 'white',
                                    cursor: 'pointer'
                                }}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                    {notification.title || `${notification.type} notification`}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                    {notification.body.substring(0, 100)}...
                                </div>
                                <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                                    {new Date(notification.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;