import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bugAPI, adminAPI, authAPI } from '../services/api/axios.js';
import { getAbility } from '../utils/ability';
import { getUser as getAuthUser } from '../utils/auth';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getAuthUser());
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const ability = getAbility();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBugs();
  }, [user, navigate]);

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

  const handleLogout = async () => {
    await authAPI.logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
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
          <h2 className="text-2xl font-bold">Bugs</h2>
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
            <div className="p-8 text-center text-gray-500">
              No bugs found
            </div>
          ) : (
            <div className="divide-y">
              {bugs.map((bug) => (
                <div key={bug._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{bug.title}</h3>
                      <p className="text-sm text-gray-600">
                        Status: <span className="font-medium">{bug.status}</span> • 
                        Priority: <span className="font-medium">{bug.priority}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Reported by: {bug.reported_by?.name || 'Unknown'}
                        {bug.assigned_to && ` • Assigned to: ${bug.assigned_to?.name}`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/bugs/${bug._id}`}
                        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                      >
                        View
                      </Link>
                      {ability.can('update', 'Bug', bug) && (
                        <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                          Edit
                        </button>
                      )}
                      {ability.can('delete', 'Bug', bug) && (
                        <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permission Debug (remove in production) */}
        <div className="mt-8 p-4 bg-gray-800 text-white rounded">
          <h3 className="font-bold mb-2">Permissions Debug:</h3>
          <div className="text-sm">
            <p>Can create bug: {ability.can('create', 'Bug') ? '✅' : '❌'}</p>
            <p>Can update any bug: {ability.can('update', 'Bug') ? '✅' : '❌'}</p>
            <p>Can delete any bug: {ability.can('delete', 'Bug') ? '✅' : '❌'}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;