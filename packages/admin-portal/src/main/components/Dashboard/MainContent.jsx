import React, { useState } from 'react';
import AnalyticsDashboard from '../Analytics/AnalyticsDashboard';
import SiteList from '../Sites/SiteList';
import SiteForm from '../Sites/SiteForm';
import CheckIn from '../CheckIn/CheckIn';
import CheckInList from '../CheckIn/CheckInList';
import DocumentVault from '../Documents/DocumentVault';
import NotificationsTab from '../Notifications/NotificationsTab';
import UserManagement from '../Users/UserManagement';
import TemplateList from '../Templates/TemplateList';
import TemplateForm from '../Templates/TemplateForm';
import InspectionCalendar from '../Calendar/InspectionCalendar';
import InspectionReport from '@splunk/inspection-report';
import ReportingCenter from '@splunk/reporting-center';
import FileList from '../Documents/FileList';
import FileUpload from '../Documents/FileUpload';
import GoogleAuth from '../Auth/GoogleAuth';
import Overview from './Overview';
import RootFolderSetup from '../Setup/RootFolderSetup';
import { theme } from '../../theme/colors';

const MainContent = ({ activeModule, sidebarCollapsed, onNavigate }) => {
  const [subView, setSubView] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [folderId, setFolderId] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [templateFolderId, setTemplateFolderId] = useState('');

  const handleCreateNew = () => {
    if (activeModule === 'users' && window.triggerUserCreate) {
      window.triggerUserCreate();
    } else {
      setSubView('create');
    }
  };

  const handleEdit = (id) => {
    setSelectedId(id);
    setSubView('edit');
  };

  const handleBack = () => {
    setSubView(null);
    setSelectedId(null);
  };

  const handleSelectTemplateFolder = () => {
    const folderId = prompt('Enter Google Drive folder ID for templates:');
    if (folderId && folderId.trim()) {
      setTemplateFolderId(folderId.trim());
    }
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'overview':
        return <Overview onNavigate={onNavigate} />;
      
      case 'sites':
        if (subView === 'create' || subView === 'edit') {
        return (
          <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', borderBottom: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                <button onClick={handleBack} style={{ 
                  padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)', 
                  background: theme.gradients.primary, 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'transform 0.2s'
                }}>
                  ← Back to Sites
                </button>
              </div>
              <div style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
                <SiteForm siteId={selectedId} onSaveComplete={handleBack} />
              </div>
            </div>
          </div>
        );
        }
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%', height: 'fit-content' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', gap: '1rem' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600', lineHeight: '1.2' }}>Sites Management</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Manage construction and industrial sites</p>
                  </div>
                  <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 0.75rem)', flexWrap: 'wrap' }}>
                    <button onClick={() => setRefreshTrigger(prev => prev + 1)} style={{ 
                      padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)', 
                      background: 'rgba(255,255,255,0.1)', 
                      color: 'white', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      fontWeight: '500',
                      backdropFilter: 'blur(10px)',
                      whiteSpace: 'nowrap',
                      minHeight: '44px'
                    }}>
                      🔄 Refresh
                    </button>
                    <button onClick={handleCreateNew} style={{ 
                      padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)', 
                      background: 'rgba(255,255,255,0.2)', 
                      color: 'white', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      fontWeight: '500',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    }}>
                      + Add New Site
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)' }}>
                <SiteList onEdit={handleEdit} onCreateNew={handleCreateNew} refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        );
      
      case 'inspections':
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: theme.gradients.primaryToSecondary,
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>Inspection Reports</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Create and manage inspection reports</p>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)' }}>
                <InspectionReport />
              </div>
            </div>
          </div>
        );
      
      case 'calendar':
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: theme.gradients.secondary,
                color: 'black'
              }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>Inspection Calendar</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Schedule and view inspection appointments</p>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)' }}>
                <InspectionCalendar />
              </div>
            </div>
          </div>
        );
      
      case 'checkins':
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%', height: 'fit-content' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600', lineHeight: '1.2' }}>Site Check-ins</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>QR code scanning and site visit tracking</p>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)' }}>
                <CheckIn />
                <div style={{ marginTop: '2rem' }}>
                  <CheckInList />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'documents':
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%)',
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>Document Vault</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Manage permits, reports and documents</p>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)' }}>
                <DocumentVault />
              </div>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: theme.gradients.primary,
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>Analytics Dashboard</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Performance metrics and insights</p>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)' }}>
                <AnalyticsDashboard />
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: theme.gradients.secondary,
                color: 'black'
              }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>Notifications</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Manage alerts and notifications</p>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)', overflow: 'hidden' }}>
                <NotificationsTab />
              </div>
            </div>
          </div>
        );
      
      case 'users':
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: theme.gradients.primaryToSecondary,
                color: 'white'
              }}>
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', gap: '1rem' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>User Management</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Manage users and permissions</p>
                  </div>
                  <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 0.75rem)', flexWrap: 'wrap' }}>
                    <button onClick={() => setRefreshTrigger(prev => prev + 1)} style={{ 
                      padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)', 
                      background: 'rgba(255,255,255,0.1)', 
                      color: 'white', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      fontWeight: '500',
                      backdropFilter: 'blur(10px)',
                      whiteSpace: 'nowrap',
                      minHeight: '44px'
                    }}>
                      🔄 Refresh
                    </button>
                    <button onClick={handleCreateNew} style={{ 
                      padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)', 
                      background: 'rgba(255,255,255,0.2)', 
                      color: 'white', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      fontWeight: '500',
                      backdropFilter: 'blur(10px)',
                      whiteSpace: 'nowrap',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    }}>
                      + Add New User
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)', overflow: 'hidden' }}>
                <UserManagement refreshTrigger={refreshTrigger} onCreateNew={handleCreateNew} />
              </div>
            </div>
          </div>
        );
      
      case 'templates':
        if (subView === 'create' || subView === 'edit') {
          return (
            <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: 'min(4vw, 2rem)', borderBottom: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                  <button onClick={handleBack} style={{ 
                    padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)', 
                    background: 'linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(45, 190, 96, 0.3)'
                  }}>
                    ← Back to Templates
                  </button>
                </div>
                <div style={{ padding: 'min(4vw, 2rem)', overflow: 'hidden' }}>
                  <TemplateForm templateId={selectedId} onSave={handleBack} onCancel={handleBack} />
                </div>
              </div>
            </div>
          );
        }
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', gap: '1rem' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>Templates Management</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Create and manage inspection templates</p>
                  </div>
                  <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 0.75rem)', flexWrap: 'wrap' }}>
                    <button onClick={handleSelectTemplateFolder} style={{ 
                      padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)', 
                      background: 'rgba(255,255,255,0.1)', 
                      color: 'white', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      fontWeight: '500',
                      backdropFilter: 'blur(10px)',
                      whiteSpace: 'nowrap',
                      minHeight: '44px'
                    }}>
                      📁 Select Folder
                    </button>
                    <button onClick={() => setRefreshTrigger(prev => prev + 1)} style={{ 
                      padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)', 
                      background: 'rgba(255,255,255,0.1)', 
                      color: 'white', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      fontWeight: '500',
                      backdropFilter: 'blur(10px)',
                      whiteSpace: 'nowrap',
                      minHeight: '44px'
                    }}>
                      🔄 Refresh
                    </button>
                    <button onClick={handleCreateNew} style={{ 
                      padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)', 
                      background: 'rgba(255,255,255,0.2)', 
                      color: 'white', 
                      border: '1px solid rgba(255,255,255,0.3)', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      fontWeight: '500',
                      backdropFilter: 'blur(10px)',
                      whiteSpace: 'nowrap',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    }}>
                      + Add New Template
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)', overflow: 'hidden' }}>
                <TemplateList onEdit={handleEdit} refreshTrigger={refreshTrigger} templateFolderId={templateFolderId} />
              </div>
            </div>
          </div>
        );
      
      case 'files':
        if (subView === 'upload') {
          return (
            <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                  <button onClick={handleBack} style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(45, 190, 96, 0.3)',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #1E8E4A 0%, #155A35 100%)';
                    e.target.style.boxShadow = '0 4px 12px rgba(45, 190, 96, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%)';
                    e.target.style.boxShadow = '0 2px 8px rgba(45, 190, 96, 0.3)';
                  }}>
                    ← Back to Files
                  </button>
                </div>
                <div style={{ padding: '2rem' }}>
                  <h2 style={{ marginBottom: '1.5rem', color: '#343a40' }}>File Upload</h2>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '1.5rem', 
                    borderRadius: '8px', 
                    marginBottom: '1.5rem',
                    border: '1px solid #e9ecef'
                  }}>
                    <label style={{ fontWeight: '600', color: '#495057', marginBottom: '0.5rem', display: 'block' }}>Google Drive Folder ID:</label>
                    <input 
                      type="text" 
                      value={folderId} 
                      onChange={(e) => setFolderId(e.target.value)}
                      placeholder="Enter folder ID from Google Drive URL"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        fontSize: '14px',
                        marginTop: '0.5rem'
                      }}
                    />
                    <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block' }}>Find this in your Google Drive URL: https://drive.google.com/drive/folders/YOUR_FOLDER_ID</small>
                  </div>
                  {folderId ? (
                    <FileUpload 
                      folderId={folderId} 
                      onUploadComplete={(fileData) => {
                        setRefreshTrigger(prev => prev + 1);
                        handleBack();
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '3rem', 
                      color: '#6c757d',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '2px dashed #dee2e6'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                      <p>Please enter a folder ID to upload files</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #F2C300 0%, #D4A900 100%)',
                color: 'black'
              }}>
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', justifyContent: 'space-between', alignItems: window.innerWidth < 768 ? 'stretch' : 'center', gap: '1rem' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>File Management</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Upload and manage Google Drive files</p>
                  </div>
                  <button onClick={() => setSubView('upload')} style={{ 
                    padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)', 
                    background: 'rgba(0,0,0,0.2)', 
                    color: 'black', 
                    border: '1px solid rgba(0,0,0,0.3)', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)',
                    whiteSpace: 'nowrap',
                    minHeight: '44px'
                  }}>
                    + Upload File
                  </button>
                </div>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)', overflow: 'hidden' }}>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: 'clamp(1rem, 3vw, 1.5rem)', 
                  borderRadius: '8px', 
                  marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
                  border: '1px solid #e9ecef'
                }}>
                  <label style={{ fontWeight: '600', color: '#495057', marginBottom: '0.5rem', display: 'block', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Google Drive Folder ID:</label>
                  <input 
                    type="text" 
                    value={folderId} 
                    onChange={(e) => setFolderId(e.target.value)}
                    placeholder="Enter folder ID from Google Drive URL"
                    style={{ 
                      width: '100%', 
                      padding: 'clamp(0.5rem, 2vw, 0.75rem)', 
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      marginTop: '0.5rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' }}>Find this in your Google Drive URL</small>
                </div>
                {folderId ? (
                  <div style={{ overflow: 'hidden' }}>
                    <FileList 
                      folderId={folderId}
                      onRefreshNeeded={refreshTrigger}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'clamp(2rem, 6vw, 3rem)', 
                    color: '#6c757d',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '2px dashed #dee2e6'
                  }}>
                    <div style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', marginBottom: '1rem' }}>📁</div>
                    <p style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Please enter a folder ID to view files</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'reporting':
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>Reporting Center</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Advanced reporting and data visualization</p>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)', overflow: 'hidden' }}>
                <ReportingCenter />
              </div>
            </div>
          </div>
        );
      


      case 'auth':
        return (
          <div style={{ padding: 'min(5vw, 2rem)', backgroundColor: '#f8f9fa', minHeight: '100%' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: 'min(4vw, 2rem)', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #F2C300 0%, #D4A900 100%)',
                color: 'black'
              }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 6vw, 2rem)', fontWeight: '600' }}>Authentication Management</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Manage Google authentication and user sessions</p>
              </div>
              <div style={{ padding: 'min(4vw, 2rem)', textAlign: 'center', overflow: 'hidden' }}>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: 'clamp(1.5rem, 4vw, 2rem)', 
                  borderRadius: '8px', 
                  border: '1px solid #e9ecef',
                  maxWidth: '100%',
                  margin: '0 auto'
                }}>
                  <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', marginBottom: '1rem' }}>🔐</div>
                  <h3 style={{ color: '#343a40', marginBottom: '1rem', fontSize: 'clamp(1.125rem, 4vw, 1.5rem)' }}>Google Authentication</h3>
                  <p style={{ color: '#6c757d', marginBottom: '2rem', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Manage your Google account connection and authentication status</p>
                  <div style={{ overflow: 'hidden' }}>
                    <GoogleAuth />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <Overview />;
    }
  };

  return (
    <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {renderContent()}
    </div>
  );
};

export default MainContent;