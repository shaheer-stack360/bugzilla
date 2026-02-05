import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from './api/axios';
import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
import Bugs from './pages/Bugs.jsx';
import Home from './components/Home.jsx';
import CreateBug from './pages/createBugs.jsx';
import BugManage from './pages/bugsManage.jsx';


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

      await api.get('/verify');
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      Cookies.remove('token');
      Cookies.remove('user');
    } finally {
      setAuthChecking(false);
    }
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (authChecking) {
      return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
    }

    //return isAuthenticated ? children : <Navigate to="/login" />;
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

        {/* Protected routes */}
        <Route path="/bugs" element={
          <ProtectedRoute>
            <Bugs />
          </ProtectedRoute>
        } />
        <Route path="/bugs/manage" element={
          <ProtectedRoute>
            <BugManage />
          </ProtectedRoute>
        } />

        <Route path="/bugs/manage/:id" element={
          <ProtectedRoute>
            <BugManage />
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