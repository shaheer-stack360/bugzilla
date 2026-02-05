// Register.jsx
import { useState } from 'react';
import api from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Developer'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/register', formData);
      
      setSuccess('Registration successful! Redirecting to login...');
      console.log('Registration successful:', response.data);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  const roles = ['Developer', 'QA', 'Manager'];

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto' }}>
      <h1>Bugzilla Registration</h1>
      
      {success && <p style={{ color: 'green', padding: '10px', background: '#d4edda' }}>{success}</p>}
      {error && <p style={{ color: 'red', padding: '10px', background: '#f8d7da' }}>{error}</p>}
      
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label>Full Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Role:</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Note: Administrator role is assigned manually
          </small>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none',
              flex: 1
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

          <button 
            type="button"
            onClick={handleLoginRedirect}
            style={{ 
              padding: '10px 20px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none' 
            }}
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}