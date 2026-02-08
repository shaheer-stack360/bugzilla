import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '../api/axios';
import './Navigation.css';

export default function Navigation() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      Cookies.remove('token');
      Cookies.remove('userData');
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2 style={{ margin: 0, color: '#fff' }}>🐛 Bugzilla</h2>
        </div>
        
        <div className="navbar-menu">
          <a href="/dashboard" className="nav-link">Dashboard</a>
          
          {user?.permissions?.includes('bug:create') && (
            <a href="/bugs/new" className="nav-link">New</a>
          )}
          
          <a href="/bugs/search" className="nav-link">Search</a>
          <a href="/reports" className="nav-link">Reports</a>
          <a href="/preferences" className="nav-link">Preferences</a>
          <a href="/help" className="nav-link">Help</a>
        </div>

        <div className="navbar-user">
          <span className="user-info">
            {user?.name} ({user?.role})
          </span>
          <button 
            onClick={handleLogout}
            className="logout-btn"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
