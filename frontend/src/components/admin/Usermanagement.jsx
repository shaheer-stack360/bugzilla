import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api/axios';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    showInactive: false,
  });

  // Edit modal
  const [editModal, setEditModal] = useState({
    isOpen: false,
    user: null,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        showInactive: filters.showInactive.toString(),
      };

      const response = await adminAPI.getUsers(params);
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const openEditModal = (user) => {
    setEditModal({ isOpen: true, user });
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role?._id || '',
    });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, user: null });
    setEditForm({ name: '', email: '', role: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.updateUser(editModal.user._id, editForm);
      if (response.data.success) {
        alert('User updated successfully');
        closeEditModal();
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleToggleActive = async (user) => {
    const confirmMsg = user.isActive
      ? 'Are you sure you want to deactivate this user?'
      : 'Are you sure you want to activate this user?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const response = user.isActive
        ? await adminAPI.deleteUser(user._id)
        : await adminAPI.activateUser(user._id);

      if (response.data.success) {
        alert(response.data.message);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-management loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>User Management</h1>
        <p className="subtitle">
          Total: {pagination.total} users • Page {pagination.page} of{' '}
          {pagination.pages}
        </p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Role:</label>
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="all">All Roles</option>
            {/* Add actual role IDs from your system */}
            <option value="Administrator">Administrator</option>
            <option value="Developer">Developer</option>
            <option value="Tester">Tester</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filters.showInactive}
              onChange={(e) =>
                handleFilterChange('showInactive', e.target.checked)
              }
            />
            Show Inactive Users
          </label>
        </div>

        <button className="refresh-btn" onClick={fetchUsers}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchUsers}>Retry</button>
        </div>
      )}

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className={!user.isActive ? 'inactive' : ''}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className="role-badge">{user.role?.name || 'N/A'}</span>
                </td>
                <td>
                  <span
                    className={`status-badge ${
                      user.isActive ? 'active' : 'inactive'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button
                      className={`btn-toggle ${
                        user.isActive ? 'deactivate' : 'activate'
                      }`}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="no-data">
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            ← Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next →
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  required
                >
                  <option value="">Select Role</option>
                  {/* Add actual role IDs from your Role collection */}
                  <option value="role_id_admin">Administrator</option>
                  <option value="role_id_dev">Developer</option>
                  <option value="role_id_tester">Tester</option>
                </select>
                <p className="help-text">
                  Note: You need to replace these with actual Role IDs from your
                  database
                </p>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;