import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import SiteSelector from '../Sites/SiteSelector';
import './Dashboard.css';

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.action === 'navigate' && event.data?.module) {
        setActiveModule(event.data.module);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => document.body.classList.remove('menu-open');
  }, [mobileMenuOpen]);

  const handleModuleChange = (module) => {
    setActiveModule(module);
    setMobileMenuOpen(false);
  };

  return (
    <div className="dashboard">
      <button 
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      <div 
        className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <Sidebar 
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
      />
      <div className="main-area">
        <SiteSelector />
        <MainContent 
          activeModule={activeModule}
          sidebarCollapsed={sidebarCollapsed}
          onNavigate={handleModuleChange}
        />
      </div>
    </div>
  );
};

export default Dashboard;