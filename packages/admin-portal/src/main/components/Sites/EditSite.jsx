import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { updateSite } from '../../services/site.service';
import { loadFromStorage, saveToStorage } from '../../utils/storage';

const EditSite = ({ site, onSave, onCancel }) => {
  // Initialize form state with site data or empty values
  const [formData, setFormData] = useState({
    name: '',
    site_id: '',
    location: '',
    folder_type: 'GoogleDrive',
    folder_link: '',
    description: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Load site data into form when component mounts or site changes
  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        site_id: site.site_id || site.id || '',
        location: site.location || '',
        folder_type: site.folder_type || site.folderType || 'GoogleDrive',
        folder_link: site.folder_link || site.folderLink || '',
        description: site.description || ''
      });
      setIsDirty(false);
    }
  }, [site]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Mark form as dirty (has unsaved changes)
    setIsDirty(true);
    
    // Clear success message when form changes
    if (success) setSuccess(false);
    
    // Clear error when form changes
    if (error) setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Site name is required');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('Site location is required');
      return;
    }
    
    if (!formData.folder_link.trim()) {
      setError('Folder link is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Update site
      const updatedSite = await updateSite(formData.site_id, formData);
      
      // Show success message
      setSuccess(true);
      setIsDirty(false);
      
      // Notify parent component
      if (onSave) {
        onSave(updatedSite);
      }
    } catch (err) {
      console.error('Error updating site:', err);
      setError(err.message || 'Failed to update site. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Discard changes and call onCancel prop
  const handleCancel = () => {
    if (isDirty) {
      // Ask for confirmation if form has unsaved changes
      if (!window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    
    if (onCancel) {
      onCancel();
    }
  };
  
  // Check if the link is valid for QR code generation
  const hasValidLink = () => {
    return formData.folder_link && formData.folder_link.trim().length > 0;
  };
  
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>✏️ Edit Construction Site</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>Update site information and QR code settings</p>
        </div>
        <button 
          onClick={handleCancel}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            padding: '12px 20px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
        >
          ← Back to Sites
        </button>
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
      {success && (
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
          <span><strong>Success:</strong> Site updated successfully!</span>
          <button 
            onClick={() => setSuccess(false)}
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
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Site ID (read-only) */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Site ID:</label>
            <input
              type="text"
              value={formData.site_id}
              readOnly
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#f8f9fa',
                color: '#6c757d',
                cursor: 'not-allowed',
                boxSizing: 'border-box'
              }}
            />
            <small style={{ color: '#6c757d', fontSize: '14px', marginTop: '4px', display: 'block' }}>
              Site ID cannot be changed after creation
            </small>
          </div>
          
          {/* Site Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Site Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter site name"
              required
              disabled={isSubmitting}
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
          
          {/* Location */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Location:</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter site location"
              required
              disabled={isSubmitting}
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
          
          {/* Folder Type */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Storage Type:</label>
            <select
              name="folder_type"
              value={formData.folder_type}
              onChange={handleChange}
              disabled={isSubmitting}
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
              <option value="OneDrive">OneDrive</option>
              <option value="Dropbox">Dropbox</option>
              <option value="SharePoint">SharePoint</option>
              <option value="NAS">NAS</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Folder Link */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Folder Link:</label>
            <input
              type="text"
              name="folder_link"
              value={formData.folder_link}
              onChange={handleChange}
              placeholder={`Enter ${formData.folder_type} folder link`}
              required
              disabled={isSubmitting}
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
              This link will be encoded in the QR code for this site
            </small>
          </div>
          
          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Description (Optional):</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter additional site details or notes"
              disabled={isSubmitting}
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>
          
          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#545b62')}
              onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = '#6c757d')}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              style={{
                backgroundColor: (isSubmitting || !isDirty) ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: (isSubmitting || !isDirty) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => !(isSubmitting || !isDirty) && (e.target.style.backgroundColor = '#5a67d8')}
              onMouseLeave={(e) => !(isSubmitting || !isDirty) && (e.target.style.backgroundColor = '#667eea')}
            >
              {isSubmitting ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      {/* QR Code Preview Card */}
      {hasValidLink() && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '24px', textAlign: 'center' }}>📱 QR Code Preview</h3>
          
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <QRCode
                value={formData.folder_link}
                size={200}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#000000"
                style={{ borderRadius: '8px', border: '1px solid #e9ecef' }}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}><strong>Site:</strong></p>
                <p style={{ margin: 0, color: '#495057', fontSize: '16px' }}>{formData.name || '(Not set)'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}><strong>ID:</strong></p>
                <p style={{ margin: 0, color: '#495057', fontSize: '16px' }}>{formData.site_id}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}><strong>Location:</strong></p>
                <p style={{ margin: 0, color: '#495057', fontSize: '16px' }}>{formData.location || '(Not set)'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}><strong>Storage Type:</strong></p>
                <p style={{ margin: 0, color: '#495057', fontSize: '16px' }}>{formData.folder_type}</p>
              </div>
            </div>
          </div>
          
          <div style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>📝 QR Code Usage:</h4>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#6c757d' }}>
              <li>Print the QR code and post it at the construction site</li>
              <li>Field staff can scan with mobile devices to access site documents</li>
              <li>The QR code links directly to the {formData.folder_type} folder</li>
              <li>Updates to the folder link will automatically update the QR code</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditSite;