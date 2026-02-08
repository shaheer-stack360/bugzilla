import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from './api/axios';
import Layout from './components/Layout';
import Login from './pages/Login.jsx';
import Register from './pages/register.jsx';
import Home from './components/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';


function App() {
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth only once on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        setIsAuthenticated(false);
        setAuthChecking(false);
        return;
      }

      // Assume authenticated if token exists (server sets cookie on login).
      // Removed dependency on /verify endpoint.
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      Cookies.remove('token');
      localStorage.removeItem('user');
    } finally {
      setAuthChecking(false);
    }
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (authChecking) {
      return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  // Public route component - SIMPLIFIED: Only check auth once
  const PublicRoute = ({ children }) => {
    if (authChecking) {
      return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
    }

    // Don't redirect based on auth state for public routes
    // Let the component handle its own redirect logic
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public routes - no auth check */}
        <Route path="/" element={<Home />} />

        {/* Login and Register handle their own redirects */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes with Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Catch-all route */}
        <Route path="*" element={
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>404 - Page Not Found</h2>
            <a href="/">
              <button style={{ padding: '10px 20px', marginTop: '20px' }}>
                Go Home
              </button>
            </a>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;