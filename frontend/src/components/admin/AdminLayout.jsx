import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api/axios';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>🐛 Bug Tracker</h2>
          <p className="admin-badge">Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span className="nav-icon">👥</span>
            User Management
          </NavLink>

          <NavLink
            to="/admin/bugs"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span className="nav-icon">🐛</span>
            Bug Management
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;