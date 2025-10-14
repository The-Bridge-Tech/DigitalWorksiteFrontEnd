import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import SiteSelector from '../Sites/SiteSelector';
import './Dashboard.css';

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.action === 'navigate' && event.data?.module) {
        setActiveModule(event.data.module);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="dashboard">
      <Sidebar 
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SiteSelector />
        <MainContent 
          activeModule={activeModule}
          sidebarCollapsed={sidebarCollapsed}
          onNavigate={setActiveModule}
        />
      </div>
    </div>
  );
};

export default Dashboard;