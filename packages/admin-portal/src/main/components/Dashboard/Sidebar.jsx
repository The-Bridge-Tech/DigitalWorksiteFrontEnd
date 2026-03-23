import React from 'react';

const Sidebar = ({ activeModule, onModuleChange, collapsed, onToggleCollapse, mobileOpen }) => {
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

  // On mobile, always show labels (ignore collapsed state)
  const isMobile = window.innerWidth < 768;
  const showLabels = isMobile || !collapsed;

  return (
    <div className={`sidebar ${collapsed && !isMobile ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          {showLabels && <span>Digital Worksite</span>}
          {!showLabels && <span>DW</span>}
        </div>
        {!isMobile && (
          <button className="toggle-btn" onClick={onToggleCollapse}>
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
            onClick={() => onModuleChange(item.id)}
            title={!showLabels ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {showLabels && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;