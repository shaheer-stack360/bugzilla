import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import BugForm from './components/BugForm';
import BugDetail from './components/BugDetail';
import { getUser } from './utils/auth';

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
        <Route path="/" element={<Home />} />

        <Route path="/login" element={
          isAuth ? <Navigate to="/dashboard" /> : <Login setIsAuth={setIsAuth} />
        } />

        <Route path="/register" element={
          isAuth ? <Navigate to="/dashboard" /> : <Register />
        } />

        <Route path="/dashboard" element={
          isAuth ? <Dashboard setIsAuth={setIsAuth} /> : <Navigate to="/login" />
        } />

        <Route path="/bugs/create" element={
          isAuth ? <BugForm /> : <Navigate to="/login" />
        } />

        <Route path="/bugs/:id" element={
          isAuth ? <BugDetail /> : <Navigate to="/login" />
        } />

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