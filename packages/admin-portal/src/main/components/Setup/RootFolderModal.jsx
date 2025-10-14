import React, { useState } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';

const RootFolderModal = ({ onComplete }) => {
  const [folderUrl, setFolderUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    if (!folderUrl.trim()) {
      setError('Please enter a Google Drive folder URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      
      // Extract folder ID from URL
      let folderId = folderUrl;
      if (folderUrl.includes('drive.google.com/drive/folders/')) {
        const match = folderUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        if (match) {
          folderId = match[1];
        }
      }
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SYSTEM_ROOT_FOLDER}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folder_id: folderId })
      });

      const data = await response.json();
      
      if (response.ok) {
        onComplete();
      } else {
        setError(data.error || 'Failed to set root folder');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>🗂️ System Setup Required</h2>
          <p style={subtitleStyle}>Please configure the root Google Drive folder to continue</p>
        </div>
        
        <div style={bodyStyle}>
          <label style={labelStyle}>Google Drive Folder URL:</label>
          <input
            type="text"
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/your-folder-id"
            style={inputStyle}
            disabled={loading}
          />
          
          {error && (
            <div style={errorStyle}>
              ❌ {error}
            </div>
          )}
          
          <div style={helpStyle}>
            <strong>Instructions:</strong>
            <ol>
              <li>Go to Google Drive and create a folder for Digital Worksite</li>
              <li>Copy the folder URL from your browser address bar</li>
              <li>Paste it above and click "Set Root Folder"</li>
            </ol>
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
              <strong>Note:</strong> You can paste either the full URL or just the folder ID.
            </p>
          </div>
        </div>
        
        <div style={footerStyle}>
          <button 
            onClick={handleSetup}
            disabled={loading || !folderUrl.trim()}
            style={buttonStyle}
          >
            {loading ? 'Setting up...' : 'Set Root Folder'}
          </button>
        </div>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  maxWidth: '500px',
  width: '90%',
  maxHeight: '80vh',
  overflow: 'hidden'
};

const headerStyle = {
  padding: '2rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  textAlign: 'center'
};

const titleStyle = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: '600'
};

const subtitleStyle = {
  margin: '0.5rem 0 0 0',
  opacity: 0.9,
  fontSize: '0.9rem'
};

const bodyStyle = {
  padding: '2rem'
};

const labelStyle = {
  display: 'block',
  fontWeight: 'bold',
  color: '#555',
  marginBottom: '0.5rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '2px solid #ddd',
  borderRadius: '6px',
  fontSize: '1rem',
  marginBottom: '1rem',
  boxSizing: 'border-box'
};

const errorStyle = {
  padding: '0.75rem',
  backgroundColor: '#f8d7da',
  color: '#721c24',
  borderRadius: '4px',
  marginBottom: '1rem',
  fontSize: '0.9rem'
};

const helpStyle = {
  backgroundColor: '#f8f9fa',
  padding: '1rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
  color: '#555'
};

const footerStyle = {
  padding: '1.5rem 2rem',
  borderTop: '1px solid #e9ecef',
  textAlign: 'right'
};

const buttonStyle = {
  padding: '0.75rem 2rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  cursor: 'pointer',
  fontWeight: '500'
};

export default RootFolderModal;