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
      <style>{`
        .user-list-container {
          padding: 16px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .user-list-container h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333333;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .error {
          padding: 10px 12px;
          background-color: #fdecea;
          border-left: 4px solid #f44336;
          border-radius: 4px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 500;
          color: #c62828;
        }
        .add-button {
          padding: 8px 16px;
          background-color: #28a745;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
          margin-bottom: 12px;
        }
        .add-button:hover {
          background-color: #218838;
        }
        .user-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 8px;
          overflow: hidden;
        }
        .user-table th, 
        .user-table td {
          padding: 8px 12px;
          text-align: left;
          font-weight: 500;
          color: #333333;
          border-bottom: 1px solid #e0e0e0;
        }
        .user-table tr:hover {
          background-color: #f5f5f5;
        }
        .edit-button {
          padding: 4px 10px;
          background-color: #fff3cd;
          color: #856404;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
          margin-right: 6px;
        }
        .edit-button:hover {
          background-color: #ffe8a1;
        }
        .delete-button {
          padding: 4px 10px;
          background-color: #f8d7da;
          color: #721c24;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .delete-button:hover {
          background-color: #f5c6cb;
        }
      `}</style>

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