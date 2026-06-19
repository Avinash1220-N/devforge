import React, { useState, useEffect } from 'react';
import { Shield, ToggleLeft, ToggleRight, Search, ChevronLeft, ChevronRight, UserMinus, UserCheck, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function UsersManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [actionLoading, setActionLoading] = useState(null); // id of user currently mutating
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getUsers(page, 10, search);
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
      setTotalUsers(res.data.totalUsers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to "${newRole}"?`)) return;
    setActionLoading(userId);
    setError('');
    setSuccess('');
    try {
      const res = await adminAPI.changeUserRole(userId, newRole);
      setSuccess(res.data.message);
      // update state
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const action = currentStatus ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user account?`)) return;
    setActionLoading(userId);
    setError('');
    setSuccess('');
    const newStatus = !currentStatus;
    try {
      const res = await adminAPI.changeUserStatus(userId, newStatus);
      setSuccess(res.data.message);
      // update state
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: newStatus } : u));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">User Directory</h2>
          <p className="text-xs text-slate-400">Search, adjust privileges, and manage account statuses ({totalUsers} total users)</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-850 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none text-slate-200 w-64 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-880 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="text-xs">Fetching users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            No users matched your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="px-5 py-4">User Profile</th>
                  <th className="px-5 py-4">GitHub Account ID</th>
                  <th className="px-5 py-4">System Role</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4">Joined Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {users.map((user) => {
                  const isSelf = user._id === currentUser?._id;
                  const isProcessing = actionLoading === user._id;

                  return (
                    <tr key={user._id} className="hover:bg-slate-900/35 transition-colors text-slate-200">
                      <td className="px-5 py-4 flex items-center gap-3">
                        <img
                          src={user.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=DF'}
                          alt={user.name}
                          className="w-8 h-8 rounded-full border border-slate-800"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100 flex items-center gap-1.5">
                            {user.name}
                            {isSelf && (
                              <span className="text-[9px] bg-slate-950/80 border border-slate-850 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500">{user.email || 'No email shared'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[10px] text-slate-400">
                        {user.githubId}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          disabled={isSelf || isProcessing}
                          className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg p-1.5 text-xs text-slate-350 focus:outline-none disabled:opacity-50"
                        >
                          <option value="user">User</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${user.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          disabled={isSelf || isProcessing}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 ${user.isActive ? 'bg-red-950/20 border-red-900/40 hover:bg-red-900/20 text-red-400' : 'bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-900/20 text-emerald-400'}`}
                          title={user.isActive ? 'Deactivate/Suspend Account' : 'Re-activate Account'}
                        >
                          {user.isActive ? (
                            <>
                              <UserMinus className="w-3.5 h-3.5" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-850 px-5 py-4 bg-slate-900 select-none">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <span className="text-slate-350 font-bold">{page}</span> of <span className="text-slate-350 font-bold">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-800 rounded bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-800 rounded bg-slate-950 text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
