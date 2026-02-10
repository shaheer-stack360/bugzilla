import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bugAPI, userAPI } from '../services/api/axios.js';
import { getUser } from '../utils/auth.js';

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

const BugDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getUser();

    const [bug, setBug] = useState(null);
    const [access, setAccess] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [assigning, setAssigning] = useState(false);
    const [assignForm, setAssignForm] = useState({ assigned_to: '', priority: '' });
    const [confirmDelete, setConfirmDelete] = useState(false);

    // ✅ Developers list for assign dropdown
    const [developers, setDevelopers] = useState([]);
    const [developersLoading, setDevelopersLoading] = useState(false);

    // --- Fetch single bug ---
    const fetchBug = useCallback(async () => {
        setLoading(true);
        try {
            const response = await bugAPI.getOne(id);
            if (response.data.success) {
                const b = response.data.bug;
                setBug(b);
                setAccess(response.data.access || {});
                setEditForm({
                    title: b.title || '',
                    description: b.description || '',
                    expected_behavior: b.expected_behavior || '',
                    actual_behavior: b.actual_behavior || '',
                    priority: b.priority || 'Medium',
                    status: b.status || 'Open',
                });
                setAssignForm({
                    assigned_to: b.assigned_to?._id || '',
                    priority: b.priority || 'Medium',
                });
            } else {
                setError(response.data.message || 'Bug not found');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Bug not found');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchBug();
    }, [fetchBug]);

    // ✅ Fetch developers only when assign panel opens
    const handleOpenAssign = async () => {
        setAssigning(true);
        if (developers.length > 0) return; // already loaded
        setDevelopersLoading(true);
        try {
            const response = await userAPI.getDevelopers();
            if (response.data.success) {
                setDevelopers(response.data.developers);
                // Pre-select current assignee if present
                if (!assignForm.assigned_to && response.data.developers.length > 0) {
                    setAssignForm(f => ({ ...f, assigned_to: response.data.developers[0]._id }));
                }
            }
        } catch (err) {
            console.error('Failed to fetch developers:', err);
        } finally {
            setDevelopersLoading(false);
        }
    };

    // --- Update bug ---
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setActionError('');
        setActionLoading(true);
        try {
            const response = await bugAPI.update(id, editForm);
            if (response.data.success) {
                setBug(response.data.bug);
                setEditing(false);
            } else {
                setActionError(response.data.message || 'Update failed');
            }
        } catch (err) {
            setActionError(err.response?.data?.error || 'Update failed');
        } finally {
            setActionLoading(false);
        }
    };

    // --- Status update ---
    const handleStatusUpdate = async (newStatus) => {
        setActionError('');
        setActionLoading(true);
        try {
            const response = await bugAPI.update(id, { status: newStatus });
            if (response.data.success) {
                setBug(response.data.bug);
            } else {
                setActionError(response.data.message || 'Status update failed');
            }
        } catch (err) {
            setActionError(err.response?.data?.error || 'Status update failed');
        } finally {
            setActionLoading(false);
        }
    };

    // --- Assign bug ---
    const handleAssign = async (e) => {
        e.preventDefault();
        setActionError('');
        setActionLoading(true);
        try {
            const response = await bugAPI.assign(id, assignForm);
            if (response.data.success) {
                const updatedBug = {
                    ...response.data.bug,
                    assigned_to: {
                        _id: response.data.bug.assigned_to,
                        name: response.data.bug.assigned_to_name
                    }
                };
                setBug(updatedBug);
                setAssigning(false);
            } else {
                setActionError(response.data.error || 'Assignment failed');
            }
        } catch (err) {
            setActionError(err.response?.data?.error || 'Assignment failed');
        } finally {
            setActionLoading(false);
        }
    };

    // --- Delete bug ---
    const handleDelete = async () => {
        setActionError('');
        setActionLoading(true);
        try {
            const response = await bugAPI.delete(id);
            if (response.data.success) navigate('/dashboard');
            else setActionError(response.data.error || 'Delete failed');
        } catch (err) {
            setActionError(err.response?.data?.error || 'Delete failed');
        } finally {
            setConfirmDelete(false);
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error)
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link to="/dashboard" className="text-blue-600 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold">Bug Tracker</h1>
                    <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                        ← Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {actionError && (
                    <div className="p-3 bg-red-100 text-red-700 rounded">
                        {actionError}
                    </div>
                )}

                {/* Bug Detail Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    {!editing ? (
                        <>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-2">{bug.title}</h2>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${STATUS_COLORS[bug.status] || 'bg-gray-100 text-gray-700'}`}>
                                            {bug.status}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${PRIORITY_COLORS[bug.priority] || 'bg-gray-100 text-gray-700'}`}>
                                            {bug.priority} Priority
                                        </span>
                                    </div>
                                </div>
                                {access.canEdit && (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4 text-sm text-gray-700">
                                <div>
                                    <p className="font-medium text-gray-900">Description</p>
                                    <p className="mt-1 whitespace-pre-wrap">{bug.description || '—'}</p>
                                </div>
                                {bug.expected_behavior && (
                                    <div>
                                        <p className="font-medium text-gray-900">Expected Behavior</p>
                                        <p className="mt-1 whitespace-pre-wrap">{bug.expected_behavior}</p>
                                    </div>
                                )}
                                {bug.actual_behavior && (
                                    <div>
                                        <p className="font-medium text-gray-900">Actual Behavior</p>
                                        <p className="mt-1 whitespace-pre-wrap">{bug.actual_behavior}</p>
                                    </div>
                                )}
                                <div className="pt-2 border-t grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="font-medium text-gray-900">Reported By</p>
                                        <p>{bug.reported_by?.name || 'Unknown'} ({bug.reported_by?.email || '—'})</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Assigned To</p>
                                        <p>{bug.assigned_to?.name || 'Unassigned'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Created</p>
                                        <p>{bug.createdAt ? new Date(bug.createdAt).toLocaleDateString() : '—'}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Last Updated</p>
                                        <p>{bug.updatedAt ? new Date(bug.updatedAt).toLocaleDateString() : '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold mb-4">Edit Bug</h2>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                {user?.role !== 'Manager' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                rows={4}
                                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Behavior</label>
                                                <textarea
                                                    value={editForm.expected_behavior}
                                                    onChange={(e) => setEditForm({ ...editForm, expected_behavior: e.target.value })}
                                                    rows={3}
                                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Behavior</label>
                                                <textarea
                                                    value={editForm.actual_behavior}
                                                    onChange={(e) => setEditForm({ ...editForm, actual_behavior: e.target.value })}
                                                    rows={3}
                                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="Open">Open</option>
                                                <option value="Assigned">Assigned</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={editForm.priority}
                                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(false)}
                                        className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* Actions Panel */}
                {!editing && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

                        <div className="flex flex-wrap gap-3">
                            {access.canResolve && bug.status !== 'Resolved' && (
                                <button
                                    onClick={() => handleStatusUpdate('Resolved')}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    Mark Resolved
                                </button>
                            )}
                            {access.canOpen && bug.status !== 'Open' && (
                                <button
                                    onClick={() => handleStatusUpdate('Open')}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Open
                                </button>
                            )}
                            {access.canClose && bug.status !== 'Closed' && (
                                <button
                                    onClick={() => handleStatusUpdate('Closed')}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Close
                                </button>
                            )}
                            {access.canReopen && (bug.status === 'Closed' || bug.status === 'Resolved') && (
                                <button
                                    onClick={() => handleStatusUpdate('Open')}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                                >
                                    Reopen
                                </button>
                            )}
                            {access.canAssign && (
                                <button
                                    onClick={assigning ? () => setAssigning(false) : handleOpenAssign}
                                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    {assigning ? 'Cancel Assign' : 'Assign Bug'}
                                </button>
                            )}
                            {access.canDelete && (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Delete Bug
                                </button>
                            )}
                        </div>

                        {/* ✅ Assign Form with Developer Dropdown */}
                        {assigning && (
                            <form onSubmit={handleAssign} className="mt-4 p-4 bg-gray-50 rounded border space-y-3">
                                <h4 className="font-medium text-sm">Assign Bug</h4>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">
                                        Developer <span className="text-red-500">*</span>
                                    </label>
                                    {developersLoading ? (
                                        <div className="text-sm text-gray-500 py-2">Loading developers...</div>
                                    ) : developers.length === 0 ? (
                                        <div className="text-sm text-red-500 py-2">No active developers found.</div>
                                    ) : (
                                        <select
                                            required
                                            value={assignForm.assigned_to}
                                            onChange={(e) => setAssignForm({ ...assignForm, assigned_to: e.target.value })}
                                            className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">— Select a developer —</option>
                                            {developers.map((dev) => (
                                                <option key={dev._id} value={dev._id}>
                                                    {dev.name} ({dev.email})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                {access.isManager && (
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">Priority</label>
                                        <select
                                            value={assignForm.priority}
                                            onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                                            className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                )}
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setAssigning(false)}
                                        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || developersLoading || developers.length === 0}
                                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Assigning...' : 'Confirm Assign'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Delete Confirm */}
                        {confirmDelete && (
                            <div className="mt-4 p-4 bg-red-50 rounded border border-red-200 space-y-3">
                                <p className="text-sm text-red-700 font-medium">
                                    Are you sure you want to delete this bug? This cannot be undone.
                                </p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setConfirmDelete(false)}
                                        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={actionLoading}
                                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default BugDetail;