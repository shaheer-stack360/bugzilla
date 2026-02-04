import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login.jsx';
import Bugs from './pages/Bugs.jsx';
import Home from './components/Home.jsx';

function App() {
  // Simple route protection
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/bugs" element={
          <ProtectedRoute>
            <Bugs />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;