import React from 'react';

const Sidebar = ({ activeModule, onModuleChange, collapsed, onToggleCollapse }) => {
  const menuItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'sites', icon: '🏗️', label: 'Sites' },
    { id: 'inspections', icon: '📋', label: 'Inspections' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'checkins', icon: '📱', label: 'Check-ins' },
    { id: 'documents', icon: '📁', label: 'Documents' },
    { id: 'files', icon: '📄', label: 'Files' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'reporting', icon: '📊', label: 'Reporting' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'templates', icon: '📝', label: 'Templates' },
    { id: 'auth', icon: '🔐', label: 'Authentication' }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          {!collapsed && <span>Digital Worksite</span>}
          {collapsed && <span>DW</span>}
        </div>
        <button className="toggle-btn" onClick={onToggleCollapse}>
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
            onClick={() => onModuleChange(item.id)}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;