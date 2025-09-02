// UserForm.jsx
// User Form Component for Admin Portal

import React, { useState, useEffect } from 'react';
import { createUser, updateUser, getUser } from '../../services/users.service';
import { saveToStorage, loadFromStorage } from '../../utils/storage';
import styled from 'styled-components';

// Styled components
const FormContainer = styled.div`
  padding: 2rem;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  color: #343a40;

  h2 {
    font-size: 1.8rem;
    font-weight: 600;
    color: #007bff;
    margin-bottom: 2rem;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 0.5rem;
    text-align: center;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #495057;
  }

  input,
  select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const CancelButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover:not(:disabled) {
    color: #343a40;
  }
`;

const SaveButton = styled.button`
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background-color: #0056b3;
    transform: translateY(-2px);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const FormError = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  font-weight: 500;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
`;

const DismissButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-weight: bold;
  cursor: pointer;
  margin-left: 1rem;
`;

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
      <div className="user-form loading">
        <p>Loading user...</p>
      </div>
    );
  }

  return (
    <FormContainer>
      <h2>{isEditing ? 'Edit User' : 'Create New User'}</h2>

      {error && (
        <FormError>
          <p>{error}</p>
          <DismissButton onClick={() => setError(null)}>
            Dismiss
          </DismissButton>
        </FormError>
      )}

      <form onSubmit={handleSubmit}>
        <FormGroup>
          <label htmlFor="user-name">Name:</label>
          <input
            id="user-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            required
          />
        </FormGroup>

        <FormGroup>
          <label htmlFor="user-email">Email Address:</label>
          <input
            id="user-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            required
          />
        </FormGroup>

        <FormGroup>
          <label htmlFor="user-company">Company Name:</label>
          <input
            id="user-company"
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Enter company name"
          />
        </FormGroup>

        <FormGroup>
          <label htmlFor="user-role">Role:</label>
          <select
            id="user-role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Role --</option>
            <option value="supervisor">Supervisor</option>
            <option value="contractor">Contractor</option>
            <option value="inspector">Inspector</option>
            <option value="admin">Admin</option>
          </select>
        </FormGroup>


        <FormActions>
          <CancelButton
            type="button"
            onClick={handleDiscard}
            className="cancel-button"
            disabled={isSaving}
          >
            {isEditing ? 'Cancel' : 'Discard'}
          </CancelButton>

          <SaveButton
            type="submit"
            className="save-button"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (isEditing ? 'Update User' : 'Save User')}
          </SaveButton>
        </FormActions>
      </form>
    </FormContainer>
  );
};

export default UserForm;