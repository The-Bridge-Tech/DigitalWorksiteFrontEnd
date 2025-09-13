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
    <div className="edit-site">
  

      <div className="edit-site-header">
        <h2>Edit Construction Site</h2>
        <button className="back-button" onClick={handleCancel}>
          <span>←</span> Back to Sites
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <p>Site updated successfully!</p>
        </div>
      )}
      
      <div className="site-form">
        {/* Site ID (read-only) */}
        <div className="form-group read-only">
          <label htmlFor="site_id">Site ID:</label>
          <input
            type="text"
            id="site_id"
            name="site_id"
            value={formData.site_id}
            readOnly
          />
          <span className="help-text">Site ID cannot be changed</span>
        </div>
        
        {/* Site Name */}
        <div className="form-group">
          <label htmlFor="name">Site Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter site name"
            required
          />
        </div>
        
        {/* Location */}
        <div className="form-group">
          <label htmlFor="location">Location:</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter site location"
            required
          />
        </div>
        
        {/* Folder Type */}
        <div className="form-group">
          <label htmlFor="folder_type">Storage Type:</label>
          <select
            id="folder_type"
            name="folder_type"
            value={formData.folder_type}
            onChange={handleChange}
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
        <div className="form-group full-width">
          <label htmlFor="folder_link">Folder Link:</label>
          <input
            type="text"
            id="folder_link"
            name="folder_link"
            value={formData.folder_link}
            onChange={handleChange}
            placeholder={`Enter ${formData.folder_type} folder link`}
            required
          />
          <span className="help-text">
            This link will be encoded in the QR code for this site
          </span>
        </div>
        
        {/* Description */}
        <div className="form-group full-width">
          <label htmlFor="description">Description (Optional):</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter additional site details or notes"
          />
        </div>
        
        {/* QR Code Preview */}
        <div className="form-preview">
          <div className="preview-header">
            <h3>QR Code Preview</h3>
          </div>
          
          <div className="preview-content">
            {hasValidLink() ? (
              <div className="qr-code-container">
                <QRCode
                  value={formData.folder_link}
                  size={150}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            ) : (
              <div className="qr-code-container" style={{ padding: '24px' }}>
                <p>Add a folder link to generate QR code</p>
              </div>
            )}
            
            <div className="preview-details">
              <p>
                <span className="label">Site Name:</span><br />
                {formData.name || '(Not set)'}
              </p>
              
              <p>
                <span className="label">Location:</span><br />
                {formData.location || '(Not set)'}
              </p>
              
              <p>
                <span className="label">Storage Type:</span><br />
                {formData.folder_type}
              </p>
              
              <p>
                <span className="label">Link:</span><br />
                {formData.folder_link ? (
                  <span className="link-display">{formData.folder_link}</span>
                ) : (
                  '(Not set)'
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="button"
            className="save-button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSite;