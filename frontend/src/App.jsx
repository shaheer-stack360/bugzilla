import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import BugForm from './components/BugForm';
import BugDetail from './components/BugDetail';
import { getUser } from './utils/auth';

// Admin components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import BugManagement from './components/admin/BugManagement';

// Protected route wrapper for admin
const AdminRoute = ({ children }) => {
  const user = getUser();
  
  // Check if user exists and has Administrator role
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has admin role (adjust based on your role structure)
  const isAdmin = user.role?.name === 'Administrator' || user.role === 'Administrator';
  
  if (!isAdmin) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl mb-4 text-red-600">Access Denied</h2>
        <p className="mb-4">You need Administrator privileges to access this page.</p>
        <a href="/dashboard" className="text-blue-600 hover:underline">Go to Dashboard</a>
      </div>
    );
  }
  
  return children;
};

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    setIsAuth(user !== null);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={
          isAuth ? <Navigate to="/dashboard" /> : <Login setIsAuth={setIsAuth} />
        } />

        <Route path="/register" element={
          isAuth ? <Navigate to="/dashboard" /> : <Register />
        } />

        {/* User Routes */}
        <Route path="/dashboard" element={
          isAuth ? <Dashboard setIsAuth={setIsAuth} /> : <Navigate to="/login" />
        } />

        <Route path="/bugs/create" element={
          isAuth ? <BugForm /> : <Navigate to="/login" />
        } />

        <Route path="/bugs/:id" element={
          isAuth ? <BugDetail /> : <Navigate to="/login" />
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="bugs" element={<BugManagement />} />
        </Route>

        {/* 404 Route */}
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