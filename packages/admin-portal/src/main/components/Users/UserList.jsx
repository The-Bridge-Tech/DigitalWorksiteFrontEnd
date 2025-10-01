// UserList.jsx
// Displays list of users and integrates UserForm

import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../../services/users.service';
import UserForm from './UserForm';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all users
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUsers();

      // Normalize company field (sometimes API may return `companyName`)
      const normalized = (data || []).map(u => ({
        ...u,
        company: u.company || u.companyName || "N/A",
        role: u.role || "N/A",
      }));

      setUsers(normalized);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(`Failed to load users: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddNew = () => {
    setSelectedUserId(null);
    setShowForm(true);
  };

  const handleEdit = (id) => {
    setSelectedUserId(id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(`Failed to delete user: ${err.message || 'Unknown error'}`);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setSelectedUserId(null);
    loadUsers();
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedUserId(null);
  };

  if (showForm) {
    return (
      <UserForm
        userId={selectedUserId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

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
          <p style={{ color: '#666', margin: 0 }}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '600' }}>👥 User Management</h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>Manage system users and their permissions</p>
          </div>
          <button 
            onClick={handleAddNew}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              padding: '12px 24px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            ➕ Add New User
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

      {/* Users Grid */}
      {users.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>No users found</h3>
          <p style={{ margin: 0, color: '#6c757d' }}>Add your first user to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {users.map(user => (
            <div key={user.fileId} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
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
              
              {/* User Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginRight: '16px'
                }}>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                    {user.name || 'Unnamed User'}
                  </h3>
                  <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>{user.email}</p>
                </div>
              </div>
              
              {/* User Details */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}>🏢 Company</p>
                  <p style={{ margin: 0, color: '#495057', fontSize: '16px', fontWeight: '500' }}>
                    {user.company}
                  </p>
                </div>
                
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '14px' }}>💼 Role</p>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    border: '1px solid #bbdefb'
                  }}>
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(user.fileId)}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    flex: 1
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                >
                  ✏️ Edit
                </button>
                
                <button
                  onClick={() => handleDelete(user.fileId)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    flex: 1
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
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

export default UserList;