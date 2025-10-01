// FileList.jsx
// File List Component for Admin Portal

import React, { useState, useEffect } from 'react';
import { listFiles, deleteFile, getFileContent } from '../../services/drive.service';
import { saveToStorage, loadFromStorage } from '../../utils/storage';

const FileList = ({ folderId, onFileSelect, onRefreshNeeded }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [sortField, setSortField] = useState('modifiedTime'); // Default sort by modified date
  const [sortDirection, setSortDirection] = useState('desc'); // Default newest first

  // Load saved sort preferences
  useEffect(() => {
    const savedSortField = loadFromStorage('files_sort_field', 'modifiedTime');
    const savedSortDirection = loadFromStorage('files_sort_direction', 'desc');
    
    setSortField(savedSortField);
    setSortDirection(savedSortDirection);
  }, []);

  // Fetch files when folderId changes or refresh is needed
  useEffect(() => {
    if (folderId) {
      fetchFiles();
    } else {
      setFiles([]);
    }
  }, [folderId, onRefreshNeeded]);

  // Fetch files from Google Drive
  const fetchFiles = async () => {
    if (!folderId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedFiles = await listFiles({
        folderId,
        fields: "files(id,name,mimeType,createdTime,modifiedTime,webViewLink,size)"
      });
      
      // Sort files based on current sort settings
      const sortedFiles = sortFiles(fetchedFiles, sortField, sortDirection);
      setFiles(sortedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError(`Failed to fetch files: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sort change
  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    
    setSortField(field);
    setSortDirection(newDirection);
    
    // Save sort preferences
    saveToStorage('files_sort_field', field);
    saveToStorage('files_sort_direction', newDirection);
    
    // Sort the current file list
    setFiles(sortFiles([...files], field, newDirection));
  };

  // Helper to sort files
  const sortFiles = (fileList, field, direction) => {
    return [...fileList].sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];
      
      // Handle different field types
      if (field === 'name') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      } else if (field === 'size') {
        valueA = valueA || 0;
        valueB = valueB || 0;
      }
      
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // View file content
  const handleViewFile = async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedFile(file);
      
      // Only fetch content for text-based files
      if (isTextFile(file.mimeType)) {
        const content = await getFileContent(file.id);
        setFileContent(content);
      } else {
        setFileContent(null);
      }
      
      setIsViewerOpen(true);
    } catch (error) {
      console.error('Error viewing file:', error);
      setError(`Failed to view file: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check if file is text-based
  const isTextFile = (mimeType) => {
    const textMimeTypes = [
      'text/',
      'application/json',
      'application/xml',
      'application/javascript',
      'application/x-javascript'
    ];
    
    return textMimeTypes.some(type => mimeType?.startsWith(type));
  };

  // Delete file
  const handleDeleteFile = async (fileId, fileName) => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await deleteFile(fileId);
      
      // Remove file from list
      setFiles(files.filter(file => file.id !== fileId));
      
      // Close viewer if deleted file was being viewed
      if (selectedFile && selectedFile.id === fileId) {
        setIsViewerOpen(false);
        setSelectedFile(null);
        setFileContent(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(`Failed to delete file: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Close file viewer
  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedFile(null);
    setFileContent(null);
  };

  if (isLoading && !isViewerOpen && files.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #17a2b8', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>📁 Document Management</h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>View and manage files in the selected folder</p>
          </div>
          <button 
            onClick={fetchFiles} 
            disabled={isLoading || !folderId}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              padding: '12px 20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: (isLoading || !folderId) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              opacity: (isLoading || !folderId) ? 0.6 : 1
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px 20px',
          borderRadius: '8px',
          border: '1px solid #f5c6cb',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span><strong>Error:</strong> {error}</span>
          <button 
            onClick={() => setError(null)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Files Grid */}
      {!isLoading && !error && files.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>No files found</h3>
          <p style={{ margin: 0, color: '#6c757d' }}>This folder appears to be empty.</p>
        </div>
      ) : files.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {files.map(file => {
            const fileIcon = getFileIcon(file.mimeType);
            return (
              <div key={file.id} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
              }}>
                
                {/* File Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '32px',
                    marginRight: '12px',
                    minWidth: '40px'
                  }}>
                    {fileIcon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#2c3e50',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {file.name}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
                      {formatMimeType(file.mimeType)}
                    </p>
                  </div>
                </div>
                
                {/* File Details */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}>🕰️ Last Modified</p>
                  <p style={{ margin: 0, color: '#495057', fontSize: '14px' }}>
                    {formatDate(file.modifiedTime)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleViewFile(file)}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                  >
                    👁️ View
                  </button>
                  
                  <a 
                    href={file.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '6px 12px',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1e7e34'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                  >
                    🔗 Open
                  </a>
                  
                  {onFileSelect && (
                    <button
                      onClick={() => onFileSelect(file)}
                      style={{
                        backgroundColor: '#6f42c1',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#5a32a3'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#6f42c1'}
                    >
                      ✅ Select
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteFile(file.id, file.name)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      
      {/* File Viewer Modal */}
      {isViewerOpen && selectedFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid #e9ecef',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '20px' }}>
                📄 {selectedFile.name}
              </h3>
              <button 
                onClick={handleCloseViewer}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Modal Content */}
            <div style={{
              padding: '24px',
              flex: 1,
              overflow: 'auto'
            }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '4px solid #f3f3f3', 
                    borderTop: '4px solid #17a2b8', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 10px'
                  }}></div>
                  <p style={{ color: '#666', margin: 0 }}>Loading file content...</p>
                </div>
              ) : isTextFile(selectedFile.mimeType) ? (
                <pre style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {fileContent}
                </pre>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
                  <h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>Preview not available</h4>
                  <p style={{ margin: '0 0 24px 0', color: '#6c757d' }}>
                    This file type cannot be previewed in the browser.
                  </p>
                  <a 
                    href={selectedFile.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      padding: '12px 24px',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                  >
                    🔗 Open in Google Drive
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Helper to get file icon based on mime type
function getFileIcon(mimeType) {
  if (!mimeType) return '📄';
  
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📈';
  if (mimeType.startsWith('text/')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  if (mimeType === 'application/vnd.google-apps.folder') return '📁';
  
  return '📄';
}

// Helper to format MIME type to readable format
function formatMimeType(mimeType) {
  if (!mimeType) return 'Unknown';
  
  // Handle Google Document types
  if (mimeType === 'application/vnd.google-apps.folder') return 'Folder';
  if (mimeType.startsWith('application/vnd.google-apps.')) {
    const type = mimeType.split('.').pop();
    return `Google ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  }
  
  // Handle common types
  const mimeMap = {
    'application/pdf': 'PDF',
    'application/json': 'JSON',
    'text/plain': 'Text',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'text/javascript': 'JavaScript',
    'application/zip': 'ZIP',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/svg+xml': 'SVG',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint'
  };
  
  return mimeMap[mimeType] || mimeType.split('/')[1] || mimeType;
}

// Helper to format date
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return dateString;
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Format based on how recent the date is
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (today.getFullYear() === date.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

export default FileList;