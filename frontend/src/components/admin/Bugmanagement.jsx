import React, { useState, useEffect } from 'react';
import { adminAPI, userAPI } from '../../services/api/axios';
import './BugManagement.css';

const BugManagement = () => {
  const [bugs, setBugs] = useState([]);
  const [stats, setStats] = useState({ byStatus: {}, byPriority: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [developers, setDevelopers] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedTo: '',
    reportedBy: '',
    fromDate: '',
    toDate: '',
  });

  const [editModal, setEditModal] = useState({
    isOpen: false,
    bug: null,
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assigned_to: '',
  });

  useEffect(() => {
    fetchBugs();
    fetchDevelopers();
  }, [pagination.page, filters]);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await adminAPI.getBugs(params);
      if (response.data.success) {
        setBugs(response.data.bugs);
        setStats(response.data.stats);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bugs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDevelopers = async () => {
    try {
      const response = await userAPI.getDevelopers();
      if (response.data.success) {
        setDevelopers(response.data.developers);
      }
    } catch (err) {
      console.error('Failed to load developers:', err);
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

  const openEditModal = (bug) => {
    setEditModal({ isOpen: true, bug });
    setEditForm({
      title: bug.title,
      description: bug.description,
      status: bug.status,
      priority: bug.priority,
      assigned_to: bug.assigned_to?._id || '',
    });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, bug: null });
    setEditForm({
      title: '',
      description: '',
      status: '',
      priority: '',
      assigned_to: '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.updateBug(editModal.bug._id, editForm);
      if (response.data.success) {
        alert('Bug updated successfully');
        closeEditModal();
        fetchBugs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update bug');
    }
  };

  const handleDeleteBug = async (bugId) => {
    if (!window.confirm('Are you sure you want to permanently delete this bug?')) {
      return;
    }

    try {
      const response = await adminAPI.deleteBug(bugId);
      if (response.data.success) {
        alert(response.data.message);
        fetchBugs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete bug');
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      Critical: 'priority-critical',
      High: 'priority-high',
      Medium: 'priority-medium',
      Low: 'priority-low',
    };
    return badges[priority] || 'priority-medium';
  };

  const getStatusBadge = (status) => {
    const badges = {
      Open: 'status-open',
      Assigned: 'status-assigned',
      'In Progress': 'status-progress',
      Resolved: 'status-resolved',
      Closed: 'status-closed',
      Reopened: 'status-reopened',
    };
    return badges[status] || 'status-open';
  };

  if (loading && bugs.length === 0) {
    return (
      <div className="bug-management loading">
        <div className="spinner"></div>
        <p>Loading bugs...</p>
      </div>
    );
  }

  return (
    <div className="bug-management">
      <div className="page-header">
        <h1>Bug Management</h1>
        <p className="subtitle">
          Total: {pagination.total} bugs • Page {pagination.page} of{' '}
          {pagination.pages}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <h3>By Status</h3>
          <div className="stat-items">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="stat-item">
                <span className={`badge ${getStatusBadge(status)}`}>
                  {status}
                </span>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h3>By Priority</h3>
          <div className="stat-items">
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div key={priority} className="stat-item">
                <span className={`badge ${getPriorityBadge(priority)}`}>
                  {priority}
                </span>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Reopened">Reopened</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="all">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Assigned To:</label>
          <select
            value={filters.assignedTo}
            onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
          >
            <option value="">All</option>
            {developers.map((dev) => (
              <option key={dev._id} value={dev._id}>
                {dev.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>From:</label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>To:</label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => handleFilterChange('toDate', e.target.value)}
          />
        </div>

        <button className="refresh-btn" onClick={fetchBugs}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchBugs}>Retry</button>
        </div>
      )}

      {/* Bugs Table */}
      <div className="table-container">
        <table className="bugs-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Reported By</th>
              <th>Assigned To</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bugs.map((bug) => (
              <tr key={bug._id}>
                <td>
                  <div className="bug-title">{bug.title}</div>
                  <div className="bug-description">
                    {bug.description?.substring(0, 80)}...
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(bug.status)}`}>
                    {bug.status}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getPriorityBadge(bug.priority)}`}>
                    {bug.priority}
                  </span>
                </td>
                <td>{bug.reported_by?.name || 'Unknown'}</td>
                <td>{bug.assigned_to?.name || 'Unassigned'}</td>
                <td>{new Date(bug.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => openEditModal(bug)}>
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteBug(bug._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {bugs.length === 0 && (
          <div className="no-data">
            <p>No bugs found</p>
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
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Bug</h2>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    required
                  >
                    <option value="Open">Open</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="Reopened">Reopened</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priority: e.target.value })
                    }
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Assign To</label>
                <select
                  value={editForm.assigned_to}
                  onChange={(e) =>
                    setEditForm({ ...editForm, assigned_to: e.target.value })
                  }
                >
                  <option value="">Unassigned</option>
                  {developers.map((dev) => (
                    <option key={dev._id} value={dev._id}>
                      {dev.name}
                    </option>
                  ))}
                </select>
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

export default BugManagement;