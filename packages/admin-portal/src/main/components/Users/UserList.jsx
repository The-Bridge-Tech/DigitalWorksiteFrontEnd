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

  return (
    <div className="user-list-container">

      <h1>User Management</h1>

      {error && <p className="error">{error}</p>}

      {showForm ? (
        <UserForm
          userId={selectedUserId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <button onClick={handleAddNew} className="add-button">
            + Add New User
          </button>

          {isLoading ? (
            <p>Loading users...</p>
          ) : (
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.fileId}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.company}</td>
                      <td>{user.role}</td>
                      <td>
                        <button
                          onClick={() => handleEdit(user.fileId)}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.fileId)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default UserList;