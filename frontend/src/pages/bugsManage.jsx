// pages/BugManage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function BugManage() {
  const { id } = useParams(); // For editing existing bugs
  const navigate = useNavigate();
  const [mode, setMode] = useState(id ? 'edit' : 'create'); // 'create' or 'edit'
  const [bug, setBug] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expected_behavior: '',
    actual_behavior: '',
    priority: 'Medium',
    status: 'Open'
  });
  const [developers, setDevelopers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch bug data if editing
  useEffect(() => {
    if (id) {
      fetchBug();
    } else {
      setLoading(false);
    }
    fetchDevelopers();
  }, [id]);

  const fetchBug = async () => {
    try {
      const response = await api.get(`/bugs/${id}`);
      setBug(response.data.bug);
      setFormData({
        title: response.data.bug.title || '',
        description: response.data.bug.description || '',
        expected_behavior: response.data.bug.expected_behavior || '',
        actual_behavior: response.data.bug.actual_behavior || '',
        priority: response.data.bug.priority || 'Medium',
        status: response.data.bug.status || 'Open'
      });
    } catch (err) {
      setError('Failed to fetch bug details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDevelopers = async () => {
    try {
      // Fetch developers from users API
      const response = await api.get('/users');
      const devs = response.data.users?.filter(u => u.role === 'Developer') || [];
      setDevelopers(devs);
    } catch (err) {
      console.error('Failed to fetch developers:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'create') {
        // Create new bug
        const response = await api.post('/bugs/create', formData);
        setSuccess('Bug reported successfully!');
        setTimeout(() => navigate('/bugs'), 2000);
      } else {
        // Update existing bug
        const response = await api.put(`/bugs/${id}`, formData);
        setSuccess('Bug updated successfully!');
        setTimeout(() => navigate('/bugs'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!window.confirm('Mark this bug as resolved?')) return;
    
    try {
      await api.patch(`/bugs/${id}/resolve`);
      setSuccess('Bug marked as resolved!');
      fetchBug(); // Refresh bug data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve bug');
    }
  };

  const handleVerify = async (verified) => {
    const action = verified ? 'verify and close' : 'reopen';
    if (!window.confirm(`Are you sure you want to ${action} this bug?`)) return;
    
    try {
      await api.patch(`/bugs/${id}/verify`, { verified });
      setSuccess(`Bug ${verified ? 'verified and closed' : 'reopened'}!`);
      fetchBug(); // Refresh bug data
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleAssign = async () => {
    const assigned_to = prompt('Enter Developer ID to assign:');
    const priority = prompt('Enter new priority (Low/Medium/High/Critical):');
    
    if (!assigned_to) return;
    
    try {
      await api.put(`/bugs/${id}/assign`, { assigned_to, priority });
      setSuccess('Bug assigned successfully!');
      fetchBug(); // Refresh bug data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign bug');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this bug?')) return;
    
    try {
      await api.delete(`/bugs/${id}`);
      setSuccess('Bug deleted successfully!');
      setTimeout(() => navigate('/bugs'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete bug');
    }
  };

  const handleCancel = () => {
    navigate('/bugs');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>{mode === 'create' ? 'Report New Bug' : 'Manage Bug'}</h1>
        <button 
          onClick={handleCancel}
          style={{ 
            padding: '8px 16px', 
            background: '#6c757d', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Cancel
        </button>
      </div>

      {success && (
        <div style={{ 
          color: '#155724', 
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Success!</strong> {success}
        </div>
      )}

      {error && (
        <div style={{ 
          color: '#721c24', 
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Bug info display for edit mode */}
      {mode === 'edit' && bug && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Bug Info</h3>
          <p><strong>ID:</strong> {bug._id}</p>
          <p><strong>Status:</strong> {bug.status}</p>
          <p><strong>Priority:</strong> {bug.priority}</p>
          <p><strong>Reported by:</strong> {bug.reported_by?.name || 'Unknown'}</p>
          <p><strong>Assigned to:</strong> {bug.assigned_to?.name || 'Not assigned'}</p>
          
          {/* Action buttons based on bug state and user role */}
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Assign button (for Managers/Admins) */}
            <button 
              onClick={handleAssign}
              style={{ 
                padding: '8px 12px', 
                background: '#17a2b8', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Assign to Developer
            </button>

            {/* Resolve button (for assigned Developers) */}
            <button 
              onClick={handleResolve}
              style={{ 
                padding: '8px 12px', 
                background: '#28a745', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Mark as Resolved
            </button>

            {/* Verify/Reopen buttons (for QA) */}
            {bug.status === 'Resolved' && (
              <>
                <button 
                  onClick={() => handleVerify(true)}
                  style={{ 
                    padding: '8px 12px', 
                    background: '#20c997', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  Verify & Close
                </button>
                <button 
                  onClick={() => handleVerify(false)}
                  style={{ 
                    padding: '8px 12px', 
                    background: '#fd7e14', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  Reopen
                </button>
              </>
            )}

            {/* Delete button (for Managers/Admins) */}
            <button 
              onClick={handleDelete}
              style={{ 
                padding: '8px 12px', 
                background: '#dc3545', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Delete Bug
            </button>
          </div>
        </div>
      )}

      {/* Form for create/edit */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Brief description of the bug"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="Detailed description of the bug"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Expected Behavior *
          </label>
          <textarea
            name="expected_behavior"
            value={formData.expected_behavior}
            onChange={handleChange}
            required
            rows="3"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="What should happen normally"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Actual Behavior *
          </label>
          <textarea
            name="actual_behavior"
            value={formData.actual_behavior}
            onChange={handleChange}
            required
            rows="3"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="What actually happens"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Priority *
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {mode === 'edit' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            type="submit" 
            disabled={submitting}
            style={{ 
              padding: '12px 30px', 
              background: mode === 'create' ? '#28a745' : '#007bff',
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              flex: 1
            }}
          >
            {submitting ? 'Saving...' : mode === 'create' ? 'Report Bug' : 'Update Bug'}
          </button>

          <button 
            type="button"
            onClick={handleCancel}
            style={{ 
              padding: '12px 30px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              flex: 1
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}