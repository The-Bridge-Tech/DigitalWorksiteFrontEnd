import React, { useState } from 'react';
import AnalyticsDashboard from '../Analytics/AnalyticsDashboard';
import SiteList from '../Sites/SiteList';
import SiteForm from '../Sites/SiteForm';
import CheckIn from '../CheckIn/CheckIn';
import CheckInList from '../CheckIn/CheckInList';
import DocumentVault from '../Documents/DocumentVault';
import NotificationsTab from '../Notifications/NotificationsTab';
import UserList from '../Users/UserList';
import UserForm from '../Users/UserForm';
import TemplateList from '../Templates/TemplateList';
import TemplateForm from '../Templates/TemplateForm';
import InspectionCalendar from '../Calendar/InspectionCalendar';
import InspectionReport from '@splunk/inspection-report';
import ReportingCenter from '@splunk/reporting-center';
import FileList from '../Documents/FileList';
import FileUpload from '../Documents/FileUpload';
import GoogleAuth from '../Auth/GoogleAuth';
import Overview from './Overview';

const MainContent = ({ activeModule, sidebarCollapsed, onNavigate }) => {
  const [subView, setSubView] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [folderId, setFolderId] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateNew = () => {
    setSubView('create');
  };

  const handleEdit = (id) => {
    setSelectedId(id);
    setSubView('edit');
  };

  const handleBack = () => {
    setSubView(null);
    setSelectedId(null);
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'overview':
        return <Overview onNavigate={onNavigate} />;
      
      case 'sites':
        if (subView === 'create' || subView === 'edit') {
          return (
            <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                  <button onClick={handleBack} style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'linear-gradient(135deg, #6c757d, #495057)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'transform 0.2s'
                  }}>
                    ← Back to Sites
                  </button>
                </div>
                <div style={{ padding: '2rem' }}>
                  <SiteForm siteId={selectedId} onSaveComplete={handleBack} />
                </div>
              </div>
            </div>
          );
        }
        return (
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Sites Management</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Manage construction and industrial sites</p>
                  </div>
                  <button onClick={handleCreateNew} style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'rgba(255,255,255,0.2)', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s'
                  }}>
                    + Add New Site
                  </button>
                </div>
              </div>
              <div style={{ padding: '2rem' }}>
                <SiteList onEdit={handleEdit} />
              </div>
            </div>
          </div>
        );
      
      case 'inspections':
        return (
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Inspection Reports</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Create and manage inspection reports</p>
              </div>
              <div style={{ padding: '2rem' }}>
                <InspectionReport />
              </div>
            </div>
          </div>
        );
      
      case 'calendar':
        return (
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Inspection Calendar</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Schedule and view inspection appointments</p>
              </div>
              <div style={{ padding: '2rem' }}>
                <InspectionCalendar />
              </div>
            </div>
          </div>
        );
      
      case 'checkins':
        return (
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Site Check-ins</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>QR code scanning and site visit tracking</p>
              </div>
              <div style={{ padding: '2rem' }}>
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
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)',
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Document Vault</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Manage permits, reports and documents</p>
              </div>
              <div style={{ padding: '2rem' }}>
                <DocumentVault />
              </div>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Analytics Dashboard</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Performance metrics and insights</p>
              </div>
              <div style={{ padding: '2rem' }}>
                <AnalyticsDashboard />
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return <NotificationsTab />;
      
      case 'users':
        if (subView === 'create' || subView === 'edit') {
          return (
            <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                  <button onClick={handleBack} style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'linear-gradient(135deg, #6c757d, #495057)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ← Back to Users
                  </button>
                </div>
                <div style={{ padding: '2rem' }}>
                  <UserForm userId={selectedId} onSave={handleBack} onCancel={handleBack} />
                </div>
              </div>
            </div>
          );
        }
        return (
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Users Management</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Manage system users and permissions</p>
                  </div>
                  <button onClick={handleCreateNew} style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'rgba(255,255,255,0.2)', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)'
                  }}>
                    + Add New User
                  </button>
                </div>
              </div>
              <div style={{ padding: '2rem' }}>
                <UserList onEdit={handleEdit} />
              </div>
            </div>
          </div>
        );
      
      case 'templates':
        if (subView === 'create' || subView === 'edit') {
          return (
            <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                  <button onClick={handleBack} style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'linear-gradient(135deg, #6c757d, #495057)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ← Back to Templates
                  </button>
                </div>
                <div style={{ padding: '2rem' }}>
                  <TemplateForm templateId={selectedId} onSave={handleBack} onCancel={handleBack} />
                </div>
              </div>
            </div>
          );
        }
        return (
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Templates Management</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Create and manage inspection templates</p>
                  </div>
                  <button onClick={handleCreateNew} style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'rgba(255,255,255,0.2)', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)'
                  }}>
                    + Add New Template
                  </button>
                </div>
              </div>
              <div style={{ padding: '2rem' }}>
                <TemplateList onEdit={handleEdit} />
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
                    background: 'linear-gradient(135deg, #6c757d, #495057)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
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
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>File Management</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Upload and manage Google Drive files</p>
                  </div>
                  <button onClick={() => setSubView('upload')} style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'rgba(255,255,255,0.2)', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.3)', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)'
                  }}>
                    + Upload File
                  </button>
                </div>
              </div>
              <div style={{ padding: '2rem' }}>
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
                  <FileList 
                    folderId={folderId}
                    onRefreshNeeded={refreshTrigger}
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
                    <p>Please enter a folder ID to view files</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'reporting':
        return (
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
                color: 'white'
              }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Reporting Center</h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Advanced reporting and data visualization</p>
              </div>
              <div style={{ padding: '2rem' }}>
                <ReportingCenter />
              </div>
            </div>
          </div>
        );
      
      case 'auth':
        return (
          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: '1px solid #e9ecef', 
                background: 'linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%)',
                color: 'white'
              }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>Authentication Management</h1>
                  <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Manage Google authentication and user sessions</p>
                </div>
              </div>
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '2rem', 
                  borderRadius: '12px', 
                  border: '1px solid #e9ecef',
                  maxWidth: '500px',
                  margin: '0 auto'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
                  <h3 style={{ color: '#343a40', marginBottom: '1rem' }}>Google Authentication</h3>
                  <p style={{ color: '#6c757d', marginBottom: '2rem' }}>Manage your Google account connection and authentication status</p>
                  <GoogleAuth onAuthChange={(isSignedIn, userInfo) => {
                    console.log('Auth change:', { isSignedIn, userInfo });
                  }} />
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