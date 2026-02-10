import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bugAPI, authAPI } from '../services/api/axios.js';
import { getAbility } from '../utils/ability.js';
import { getUser } from '../utils/auth.js';
import { subject } from '@casl/ability';

const PRIORITY_COLORS = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-purple-100 text-purple-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-700',
};

const Dashboard = ({ setIsAuth }) => {
  const navigate = useNavigate();
  const [user] = useState(getUser());
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const ability = getAbility();

  const fetchBugs = async () => {
    try {
      const response = await bugAPI.getAll();
      if (response.data.success) {
        setBugs(response.data.bugs);
      }
    } catch (err) {
      console.error('Failed to fetch bugs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, []);

  const handleLogout = async () => {
    await authAPI.logout();
    setIsAuth(false);
    navigate('/login');
  };

  const handleDelete = async (e, bugId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this bug?')) return;
    try {
      const response = await bugAPI.delete(bugId);
      if (response.data.success) {
        setBugs(bugs.filter((b) => b._id !== bugId));
      }
    } catch (err) {
      console.error('Failed to delete bug:', err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please login to view dashboard</p>
        <Link to="/login" className="text-blue-600">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Bug Tracker</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.name} ({user?.role})
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            Bugs
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({bugs.length})
            </span>
          </h2>
          {ability.can('create', 'Bug') && (
            <Link
              to="/bugs/create"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Report Bug
            </Link>
          )}
        </div>

        {/* Bugs List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {bugs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No bugs found</div>
          ) : (
            <div className="divide-y">
              {bugs.map((bug) => (
                <div
                  key={bug._id}
                  onClick={() => navigate(`/bugs/${bug._id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    {/* Left: Title + Description + Badges */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{bug.title}</h3>
                      {bug.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                          {bug.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[bug.status] || 'bg-gray-100 text-gray-700'}`}>
                          {bug.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[bug.priority] || 'bg-gray-100 text-gray-700'}`}>
                          {bug.priority}
                        </span>
                      </div>
                    </div>

                    {/* Right: Delete button */}
                    {ability.can('delete', subject('Bug', bug)) && (
                      <button
                        onClick={(e) => handleDelete(e, bug._id)}
                        className="flex-shrink-0 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;