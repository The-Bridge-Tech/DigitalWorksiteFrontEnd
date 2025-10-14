import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';

const RootFolderSetup = () => {
  const [folderUrl, setFolderUrl] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkCurrentFolder();
  }, []);

  const checkCurrentFolder = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SYSTEM_ROOT_FOLDER}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentFolder(data.folder_id);
      }
    } catch (error) {
      console.error('Error checking current folder:', error);
    }
  };

  const handleSetup = async () => {
    if (!folderUrl.trim()) {
      setMessage('Please enter a Google Drive folder URL');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SYSTEM_ROOT_FOLDER}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folder_url: folderUrl })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Root folder set successfully!`);
        setCurrentFolder(data.folder_id);
        setFolderUrl('');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>🗂️ Root Folder Setup</h2>
      
      {currentFolder && (
        <div style={currentFolderStyle}>
          <p><strong>Current Root Folder ID:</strong> {currentFolder}</p>
        </div>
      )}
      
      <div style={formStyle}>
        <label style={labelStyle}>
          Google Drive Folder URL:
        </label>
        <input
          type="text"
          value={folderUrl}
          onChange={(e) => setFolderUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/your-folder-id"
          style={inputStyle}
        />
        <button 
          onClick={handleSetup}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Setting up...' : 'Set Root Folder'}
        </button>
      </div>
      
      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}
      
      <div style={helpStyle}>
        <h3>Instructions:</h3>
        <ol>
          <li>Go to Google Drive and create or select your root folder</li>
          <li>Copy the folder URL from your browser</li>
          <li>Paste it above and click "Set Root Folder"</li>
        </ol>
      </div>
    </div>
  );
};

const containerStyle = {
  maxWidth: '600px',
  margin: '2rem auto',
  padding: '2rem',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const titleStyle = {
  color: '#333',
  marginBottom: '1.5rem',
  textAlign: 'center'
};

const currentFolderStyle = {
  padding: '1rem',
  backgroundColor: '#e8f5e8',
  borderRadius: '4px',
  marginBottom: '1.5rem'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const labelStyle = {
  fontWeight: 'bold',
  color: '#555'
};

const inputStyle = {
  padding: '0.75rem',
  border: '2px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem'
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '1rem',
  cursor: 'pointer'
};

const messageStyle = {
  padding: '1rem',
  marginTop: '1rem',
  borderRadius: '4px',
  backgroundColor: '#f8f9fa',
  border: '1px solid #dee2e6'
};

const helpStyle = {
  marginTop: '2rem',
  padding: '1rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '4px'
};

export default RootFolderSetup;