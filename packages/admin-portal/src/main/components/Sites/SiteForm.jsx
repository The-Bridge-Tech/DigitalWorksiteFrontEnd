// SiteForm.jsx
// Site Form Component for Admin Portal
import React, { useState, useEffect } from 'react';
import { createSite } from '../../services/site.service';
import { checkAuthStatus, redirectToAuth } from '../../services/auth.service';

const SiteForm = ({ onSaveComplete }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    site_id: '',
    name: '',
    location: '',
    folder_type: 'GoogleDrive',
    folder_link: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthed = await checkAuthStatus();
        setIsAuthenticated(isAuthed);
        
        // If not authenticated, redirect to login
        if (!isAuthed) {
          redirectToAuth();
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Reset states when form changes
    if (qrCode) setQrCode(null);
    if (isSaved) setIsSaved(false);
    if (error) setError(null);
  };

  // Generate site ID from name if not provided
  const generateSiteId = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 20) + '_' + Date.now().toString().substring(7);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if authenticated
    if (!isAuthenticated) {
      redirectToAuth();
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setQrCode(null);
      
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Site name is required');
      }
      
      if (!formData.location.trim()) {
        throw new Error('Site location is required');
      }
      
      if (!formData.folder_link.trim()) {
        throw new Error('Folder link is required');
      }
      
      // Auto-generate site ID if not provided
      const submissionData = { ...formData };
      if (!submissionData.site_id.trim()) {
        submissionData.site_id = generateSiteId(submissionData.name);
        setFormData(prevData => ({
          ...prevData,
          site_id: submissionData.site_id
        }));
      }
      
      // Create site with QR code
      const newSite = await createSite(submissionData);
      
      // Update with QR code result
      setQrCode({
        qr_url: newSite.qr_url,
        qr_id: newSite.qr_id
      });
      
      // Set saved state
      setIsSaved(true);
      
      // Notify parent component
      if (onSaveComplete) {
        onSaveComplete(newSite);
      }
    } catch (error) {
      console.error('Error creating site:', error);
      
      // If authentication error, redirect to login
      if (error.message && error.message.includes('Authentication required')) {
        redirectToAuth();
        return;
      }
      
      setError(error.message || 'Failed to create site');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle download QR code
  const handleDownloadQR = () => {
    if (!qrCode || !qrCode.qr_url) return;
    
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = qrCode.qr_url;
    link.download = `${formData.name.replace(/\s+/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle reset form
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
      setFormData({
        site_id: '',
        name: '',
        location: '',
        folder_type: 'GoogleDrive',
        folder_link: ''
      });
      setQrCode(null);
      setIsSaved(false);
      setError(null);
    }
  };

  // If still checking authentication, show loading
  if (!authChecked) {
    return <div className="loading">Checking authentication...</div>;
  }

  // If not authenticated, show login message (though redirectToAuth should handle this)
  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h3>Authentication Required</h3>
        <p>Please sign in to access this feature.</p>
        <button 
          onClick={() => redirectToAuth()}
          className="sign-in-button"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>🏗️ Create Construction Site</h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>Add a new construction site with QR code generation</p>
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
      
      {/* Success Message */}
      {isSaved && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '15px 20px',
          borderRadius: '8px',
          border: '1px solid #c3e6cb',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span><strong>Success:</strong> Site created successfully!</span>
          <button 
            onClick={() => setIsSaved(false)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#155724',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Form Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        marginBottom: '20px'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Site Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter site name"
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Site ID (auto-generated if empty):</label>
            <input
              type="text"
              name="site_id"
              value={formData.site_id}
              onChange={handleChange}
              placeholder="Enter site ID or leave empty for auto-generation"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Location:</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter site location"
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Folder Type:</label>
            <select
              name="folder_type"
              value={formData.folder_type}
              onChange={handleChange}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="GoogleDrive">Google Drive</option>
              <option value="NAS">NAS</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Folder Link:</label>
            <input
              type="text"
              name="folder_link"
              value={formData.folder_link}
              onChange={handleChange}
              placeholder={`Enter ${formData.folder_type} folder link`}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            <small style={{ color: '#6c757d', fontSize: '14px', marginTop: '4px', display: 'block' }}>
              {formData.folder_type === 'GoogleDrive'
                ? 'Paste the Google Drive folder share link here'
                : 'Enter the network path to the NAS folder'}
            </small>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#545b62')}
              onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#6c757d')}
            >
              🔄 Reset Form
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#5a67d8')}
              onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#667eea')}
            >
              {isLoading ? '⏳ Creating Site...' : '🏗️ Create Site & Generate QR'}
            </button>
          </div>
        </form>
      </div>
      
      {/* QR Code Result */}
      {qrCode && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '24px', textAlign: 'center' }}>📱 QR Code Generated</h3>
          
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <img
                src={qrCode.qr_url}
                alt={`QR Code for ${formData.name}`}
                style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid #e9ecef' }}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}><strong>Site:</strong></p>
                <p style={{ margin: 0, color: '#495057', fontSize: '16px' }}>{formData.name}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}><strong>ID:</strong></p>
                <p style={{ margin: 0, color: '#495057', fontSize: '16px' }}>{formData.site_id}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}><strong>Location:</strong></p>
                <p style={{ margin: 0, color: '#495057', fontSize: '16px' }}>{formData.location}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}><strong>QR ID:</strong></p>
                <p style={{ margin: 0, color: '#495057', fontSize: '16px' }}>{qrCode.qr_id}</p>
              </div>
              
              <button
                onClick={handleDownloadQR}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1e7e34'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
              >
                📥 Download QR Code
              </button>
            </div>
          </div>
          
          <div style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>📝 How to Use This QR Code:</h4>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#6c757d' }}>
              <li>Download and print the QR code</li>
              <li>Post it at the construction site entrance</li>
              <li>Field staff can scan with Splunk Mobile App to access site documents</li>
              <li>The QR code links directly to the {formData.folder_type} folder for this site</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteForm;