// Login.jsx
import { useState } from 'react';
import api from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', {
        email,
        password
      });

      console.log('✅ Login successful:', response.data);

      window.location.href = '/bugs';
      
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    window.location.href = '/register';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto' }}>
      <h1>Bugzilla Login</h1>
      
      <form onSubmit={handleLogin}>
        {error && (
          <div style={{ color: 'red', padding: '10px', background: '#ffe6e6', borderRadius: '4px', marginBottom: '15px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="test@example.com"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Enter password"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '12px 24px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            marginRight: '10px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <button 
          type="button"
          onClick={handleRegisterRedirect}
          style={{ 
            padding: '12px 24px', 
            background: '#6c757d', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        >
          Register
        </button>
      </form>
    </div>
  );
}