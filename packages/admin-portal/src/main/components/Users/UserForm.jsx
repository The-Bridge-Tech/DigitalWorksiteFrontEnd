// UserForm.jsx
// User Form Component for Admin Portal

import React, { useState, useEffect } from 'react';
import { createUser, updateUser, getUser } from '../../services/users.service';
import { saveToStorage, loadFromStorage } from '../../utils/storage';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';

const UserForm = ({ userId, onSave, onCancel }) => {
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    contact_phone: '',
    license_number: '',
    subcontractor_type: '',
  });

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load user data if editing
  useEffect(() => {
    if (userId) {
      setIsEditing(true);
      loadUser(userId);
    } else {
      // Try to load draft from localStorage
      const savedDraft = loadFromStorage('user_draft');
      if (savedDraft) {
        setFormData(savedDraft);
      }
    }
  }, [userId]);

  // Save draft to localStorage
  useEffect(() => {
    if (!isEditing) {
      saveToStorage('user_draft', formData);
    }
  }, [formData, isEditing]);

  // Load user data
  const loadUser = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await getUser(id);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        company: user.company || '',
        role: user.role || '',
        contact_phone: user.contact_phone || '',
        license_number: user.license_number || '',
        subcontractor_type: user.subcontractor_type || ''
      });
    } catch (error) {
      console.error('Error loading user:', error);
      setError(`Failed to load user: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.role.trim()) {
      setError('Role is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      console.log('UserForm: Starting user save process...');

      let result;
      if (isEditing) {
        console.log('UserForm: Updating existing user...');
        result = await updateUser(userId, formData);
      } else {
        console.log('UserForm: Creating new user via database API...');
        result = await createUser({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          role: formData.role
        });
        
        saveToStorage('user_draft', null);
        console.log('UserForm: User created successfully via database API!');
      }
      
      console.log('UserForm: User created successfully!');
      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error('UserForm: Error saving user:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Unknown error occurred';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle discard/cancel
  const handleDiscard = () => {
    if (!isEditing) {
      saveToStorage('user_draft', null);
    }
    if (onCancel) {
      onCancel();
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #28a745', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>
          👥 {isEditing ? 'Edit User' : 'Create New User'}
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
          {isEditing ? 'Update user information and permissions' : 'Add a new user to the system'}
        </p>
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
          alignItems: 'flex-start'
        }}>
          <div>
            <strong>Error:</strong> {error}
            <br />
            <small style={{ opacity: 0.8, marginTop: '5px', display: 'block' }}>
              If this problem persists, please check your internet connection and try refreshing the page.
            </small>
          </div>
          <button 
            onClick={() => setError(null)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              marginLeft: '10px'
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
        border: '1px solid #e9ecef'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
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
              onFocus={(e) => e.target.style.borderColor = '#2DBE60'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Email Address:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
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
              onFocus={(e) => e.target.style.borderColor = '#2DBE60'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Company Name:</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Enter company name"
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
              onFocus={(e) => e.target.style.borderColor = '#2DBE60'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Role:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
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
              <option value="">-- Select Role --</option>
              <option value="admin">Admin</option>
              <option value="site_manager">Site Manager</option>
              <option value="contractor">Contractor</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="inspector">Inspector</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>



          {/* Subcontractor Fields */}
          {(formData.role === 'subcontractor' || formData.role === 'contractor') && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Phone Number:</label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
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
                  onFocus={(e) => e.target.style.borderColor = '#2DBE60'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>License Number:</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="Enter license number"
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
                  onFocus={(e) => e.target.style.borderColor = '#2DBE60'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>

              {formData.role === 'subcontractor' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '600' }}>Subcontractor Type:</label>
                  <select
                    name="subcontractor_type"
                    value={formData.subcontractor_type}
                    onChange={handleChange}
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
                    <option value="">-- Select Type --</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="hvac">HVAC</option>
                    <option value="roofing">Roofing</option>
                    <option value="flooring">Flooring</option>
                    <option value="painting">Painting</option>
                    <option value="concrete">Concrete</option>
                    <option value="steel">Steel Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div style={{ 
            display: 'flex', 
            gap: 'clamp(0.75rem, 3vw, 0.75rem)', 
            justifyContent: window.innerWidth < 768 ? 'stretch' : 'flex-end',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            marginTop: 'clamp(1.5rem, 4vw, 2rem)'
          }}>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              style={{
                backgroundColor: 'transparent',
                color: '#6c757d',
                border: '2px solid #6c757d',
                padding: 'clamp(0.75rem, 3vw, 0.75rem) clamp(1.5rem, 4vw, 1.5rem)',
                borderRadius: '8px',
                fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                fontWeight: '500',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                minHeight: '48px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                flex: window.innerWidth < 768 ? '1' : 'none'
              }}
              onTouchStart={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.backgroundColor = '#6c757d';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onTouchEnd={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.target.style.backgroundColor = '#6c757d';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6c757d';
                }
              }}
            >
              {isEditing ? 'Cancel' : 'Discard'}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                background: isSaving ? '#ccc' : 'linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%)',
                color: 'white',
                border: 'none',
                padding: 'clamp(0.75rem, 3vw, 0.75rem) clamp(1.5rem, 4vw, 1.5rem)',
                borderRadius: '8px',
                fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                fontWeight: '500',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                minWidth: window.innerWidth < 768 ? 'auto' : '140px',
                minHeight: '48px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: isSaving ? 'none' : '0 2px 8px rgba(45, 190, 96, 0.3)',
                flex: window.innerWidth < 768 ? '1' : 'none'
              }}
              onTouchStart={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'scale(0.98)';
                }
              }}
              onTouchEnd={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.target.style.background = 'linear-gradient(135deg, #1E8E4A 0%, #155A35 100%)';
                  e.target.style.boxShadow = '0 4px 12px rgba(45, 190, 96, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.target.style.background = 'linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%)';
                  e.target.style.boxShadow = '0 2px 8px rgba(45, 190, 96, 0.3)';
                }
              }}
            >
              {isSaving ? '⏳ Saving...' : (isEditing ? '✏️ Update User' : '👥 Create User')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UserForm;