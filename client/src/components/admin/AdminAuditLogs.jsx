import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getAuditLogs(page, 20);
      setLogs(res.data.auditLogs);
      setTotalPages(res.data.totalPages);
      setTotalLogs(res.data.totalLogs);
    } catch (err) {
      setError('Failed to fetch administrative auditing logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Audit Logs</h2>
          <p className="text-xs text-slate-400">Security history registry recording role changes, user suspensions, and managed portfolios ({totalLogs} actions logged)</p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-880 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="text-xs">Fetching administrative audit trail...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            No administrative audit actions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="px-5 py-4">Security Admin</th>
                  <th className="px-5 py-4">Action Item</th>
                  <th className="px-5 py-4">Target Entity</th>
                  <th className="px-5 py-4">Change Log Details</th>
                  <th className="px-5 py-4">Action Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/35 transition-colors text-slate-200">
                    <td className="px-5 py-4 flex items-center gap-2">
                      <img
                        src={log.adminId?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=DF'}
                        alt={log.adminId?.name || 'Admin'}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-100">{log.adminId?.name || 'System'}</span>
                        <span className="text-[9px] text-slate-500">{log.adminId?.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${log.action === 'role-change' ? 'text-purple-400 bg-purple-500/10' : log.action === 'user-disable' ? 'text-red-400 bg-red-500/10' : 'text-amber-450 bg-amber-500/10'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-350">
                      <div className="flex flex-col">
                        <span className="font-bold">{log.targetType}</span>
                        <span className="font-mono text-[9px] text-slate-500">{log.targetId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-[10px] text-slate-400 max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
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
