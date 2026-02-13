import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  const { stats, weeklyStats, recent } = dashboardData;

  // Chart data for weekly bug creation
  const weeklyChartData = {
    labels: weeklyStats.map(stat => {
      const date = new Date(stat._id);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Bugs Created',
        data: weeklyStats.map(stat => stat.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
      },
    ],
  };

  // Doughnut chart for bug status
  const bugStatusData = {
    labels: ['Open', 'Resolved'],
    datasets: [
      {
        data: [stats.bugs.open, stats.bugs.resolved],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // User status chart
  const userStatusData = {
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [stats.users.active, stats.users.inactive],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      Critical: 'priority-critical',
      High: 'priority-high',
      Medium: 'priority-medium',
      Low: 'priority-low',
    };
    return badges[priority] || 'priority-medium';
  };

  const getStatusBadge = (status) => {
    const badges = {
      Open: 'status-open',
      Assigned: 'status-assigned',
      'In Progress': 'status-progress',
      Resolved: 'status-resolved',
      Closed: 'status-closed',
      Reopened: 'status-reopened',
    };
    return badges[status] || 'status-open';
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon users">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.users.total}</p>
            <p className="stat-detail">
              {stats.users.active} active • {stats.users.inactive} inactive
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bugs">🐛</div>
          <div className="stat-content">
            <h3>Total Bugs</h3>
            <p className="stat-number">{stats.bugs.total}</p>
            <p className="stat-detail">
              {stats.bugs.open} open • {stats.bugs.resolved} resolved
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rate">📊</div>
          <div className="stat-content">
            <h3>Open Rate</h3>
            <p className="stat-number">{stats.bugs.openRate}%</p>
            <p className="stat-detail">Percentage of unresolved bugs</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Weekly Bug Creation Trend</h3>
          <div className="chart-container">
            <Line
              data={weeklyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-card small">
          <h3>Bug Status Distribution</h3>
          <div className="chart-container">
            <Doughnut
              data={bugStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-card small">
          <h3>User Status</h3>
          <div className="chart-container">
            <Doughnut
              data={userStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-row">
        <div className="activity-card">
          <h3>Recent Users</h3>
          <div className="activity-list">
            {recent.users.map((user) => (
              <div key={user._id} className="activity-item">
                <div className="activity-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="activity-details">
                  <p className="activity-name">{user.name}</p>
                  <p className="activity-meta">{user.email}</p>
                  <p className="activity-meta">
                    Role: {user.role?.name || 'N/A'} •{' '}
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-card">
          <h3>Recent Bugs</h3>
          <div className="activity-list">
            {recent.bugs.map((bug) => (
              <div key={bug._id} className="activity-item">
                <div className="activity-details">
                  <p className="activity-name">{bug.title}</p>
                  <div className="bug-badges">
                    <span className={`badge ${getStatusBadge(bug.status)}`}>
                      {bug.status}
                    </span>
                    <span className={`badge ${getPriorityBadge(bug.priority)}`}>
                      {bug.priority}
                    </span>
                  </div>
                  <p className="activity-meta">
                    Reported by: {bug.reported_by?.name || 'Unknown'} •{' '}
                    {new Date(bug.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;