import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Dashboard from './components/Dashboard';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth once on mount
  useEffect(() => {
    const checkAuth = () => {
      const hasToken = document.cookie.includes('token=');
      setIsAuth(hasToken);
      setLoading(false);
    };
    
    checkAuth();
  }, []); // Empty array - runs once

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        
        {/* Login - redirect if already authenticated */}
        <Route path="/login" element={
          isAuth ? <Navigate to="/dashboard" /> : <Login />
        } />
        
        {/* Register - redirect if already authenticated */}
        <Route path="/register" element={
          isAuth ? <Navigate to="/dashboard" /> : <Register />
        } />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          isAuth ? (
              <Dashboard />
          ) : <Navigate to="/login" />
        } />
        
        {/* Catch-all */}
        <Route path="*" element={
          <div className="p-12 text-center">
            <h2 className="text-2xl mb-4">404 - Page Not Found</h2>
            <a href="/" className="text-blue-600 hover:underline">Go Home</a>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;