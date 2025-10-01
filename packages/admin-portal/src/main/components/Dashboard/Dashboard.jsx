import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
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
      <MainContent 
        activeModule={activeModule}
        sidebarCollapsed={sidebarCollapsed}
        onNavigate={setActiveModule}
      />
    </div>
  );
};

export default Dashboard;