// UserForm.jsx
// User Form Component for Admin Portal

import React, { useState, useEffect } from 'react';
import { createUser, updateUser, getUser } from '../../services/users.service';
import { saveToStorage, loadFromStorage } from '../../utils/storage';

const UserForm = ({ userId, onSave, onCancel }) => {
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role:''
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
        role: user.role || ''
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

    try {
      setIsSaving(true);
      setError(null);

      let result;
      if (isEditing) {
        result = await updateUser(userId, formData);
      } else {
        result = await createUser(formData);
        saveToStorage('user_draft', null);
      }

      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setError(`Failed to save user: ${error.message || 'Unknown error'}`);
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
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
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
              onFocus={(e) => e.target.style.borderColor = '#28a745'}
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
              onFocus={(e) => e.target.style.borderColor = '#28a745'}
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
              onFocus={(e) => e.target.style.borderColor = '#28a745'}
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
              <option value="supervisor">Supervisor</option>
              <option value="contractor">Contractor</option>
              <option value="inspector">Inspector</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              style={{
                backgroundColor: 'transparent',
                color: '#6c757d',
                border: '2px solid #6c757d',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
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
                backgroundColor: isSaving ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => !isSaving && (e.target.style.backgroundColor = '#1e7e34')}
              onMouseLeave={(e) => !isSaving && (e.target.style.backgroundColor = '#28a745')}
            >
              {isSaving ? '⏳ Saving...' : (isEditing ? '✏️ Update User' : '👥 Save User')}
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