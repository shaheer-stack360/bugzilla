// Bugs.jsx - UPDATED VERSION
import { useState, useEffect } from 'react';
import api from '../api/axios';

function Bugs() {
  const [bugs, setBugs] = useState([]);
  const [user, setUser] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    try {
      const response = await api.get('/bugs');
      console.log('Bugs response:', response.data);

      setBugs(response.data.bugs || []);
      setUser(response.data.user || null);
      setApiResponse(response.data);

    } catch (err) {
      console.error('Error fetching bugs:', err);
      setError(err.response?.data?.message || 'Failed to fetch bugs');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = '/';
    }
  };

  const handleCreateBug = () => {
    window.location.href = '/bugs/manage'; // Changed to /bugs/manage
  };

  const handleManageBug = (bugId) => {
    window.location.href = `/bugs/manage/${bugId}`;
  };

  const refreshBugs = () => {
    setLoading(true);
    fetchBugs();
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading bugs...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Bugs Dashboard</h1>
          {user && (
            <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
              Logged in as: <strong>{user.email}</strong> |
              Role: <strong>{user.role}</strong> |
              Access: <strong>{apiResponse?.accessLevel || 'User'}</strong>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={refreshBugs}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
          
          {user?.role === 'QA' && ( // Changed from 'QA Tester' to 'QA'
            <button
              onClick={handleCreateBug}
              style={{
                padding: '8px 16px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Report New Bug
            </button>
          )}
          
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Total Bugs: {bugs.length}</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {bugs.filter(b => b.status === 'Open').length} Open • 
          {bugs.filter(b => b.status === 'Assigned').length} Assigned • 
          {bugs.filter(b => b.status === 'Resolved').length} Resolved • 
          {bugs.filter(b => b.status === 'Closed').length} Closed
        </div>
      </div>

      {bugs.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#f8f9fa', 
          borderRadius: '4px' 
        }}>
          <h3>No bugs found</h3>
          {user?.role === 'QA' && (
            <button
              onClick={handleCreateBug}
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                marginTop: '10px',
                cursor: 'pointer'
              }}
            >
              Report Your First Bug
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {bugs.map(bug => (
            <div
              key={bug._id}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{bug.title}</h3>
                  <p style={{ 
                    margin: '0 0 10px 0', 
                    color: '#666',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {bug.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '15px' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backgroundColor:
                      bug.status === 'Open' ? '#ffc107' :
                      bug.status === 'Assigned' ? '#17a2b8' :
                      bug.status === 'Resolved' ? '#28a745' :
                      bug.status === 'Closed' ? '#6c757d' : '#007bff',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {bug.status}
                  </span>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                fontSize: '14px', 
                color: '#666',
                marginTop: '10px',
                flexWrap: 'wrap'
              }}>
                <div>
                  <strong>Priority:</strong> 
                  <span style={{
                    marginLeft: '5px',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    backgroundColor: 
                      bug.priority === 'Critical' ? '#dc3545' :
                      bug.priority === 'High' ? '#fd7e14' :
                      bug.priority === 'Medium' ? '#ffc107' : '#6c757d',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {bug.priority}
                  </span>
                </div>
                <div>
                  <strong>Reported by:</strong> {bug.reported_by?.name || 'Unknown'}
                </div>
                {bug.assigned_to && (
                  <div>
                    <strong>Assigned to:</strong> {bug.assigned_to?.name || 'Unknown'}
                  </div>
                )}
                <div>
                  <strong>Created:</strong> {new Date(bug.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div style={{ 
                marginTop: '15px', 
                display: 'flex', 
                gap: '10px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => handleManageBug(bug._id)}
                  style={{
                    padding: '6px 12px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                >
                  Manage Bug
                </button>
                
                {/* Optional: Add quick actions based on role */}
                {(user?.role === 'Manager' || user?.role === 'Administrator') && !bug.assigned_to && (
                  <button
                    onClick={() => handleManageBug(bug._id)}
                    style={{
                      padding: '6px 12px',
                      background: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Assign
                  </button>
                )}
                
                {bug.assigned_to?.id === user?.id && bug.status !== 'Resolved' && bug.status !== 'Closed' && (
                  <button
                    onClick={() => handleManageBug(bug._id)}
                    style={{
                      padding: '6px 12px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bugs;