// Bugs.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';

function Bugs() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    // Token is automatically added by axios interceptor
    try {
      const response = await api.get('/bugs'); // No need for headers
      setBugs(response.data.bugs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bugs');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) return <div>Loading bugs...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Bugs List</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {bugs.length === 0 ? (
        <p>No bugs found</p>
      ) : (
        <ul>
          {bugs.map(bug => (
            <li key={bug._id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc' }}>
              <h3>{bug.title}</h3>
              <p>{bug.description}</p>
              <small>Status: {bug.status} | Priority: {bug.priority}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Bugs;