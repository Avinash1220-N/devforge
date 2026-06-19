import React, { useState, useEffect } from 'react';
import { Search, Globe, Trash2, Eye, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function PortfoliosManagement() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPortfolios, setTotalPortfolios] = useState(0);
  const [actionLoading, setActionLoading] = useState(null); // id of portfolio currently mutating
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPortfolios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getPortfolios(page, 10, search);
      setPortfolios(res.data.portfolios);
      setTotalPages(res.data.totalPages);
      setTotalPortfolios(res.data.totalPortfolios);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch portfolios registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPortfolios();
  };

  const handleSoftDelete = async (portfolioId) => {
    if (!window.confirm('Are you sure you want to soft-delete/moderate this portfolio? Deleting will remove it from all public explorer paths.')) return;
    setActionLoading(portfolioId);
    setError('');
    setSuccess('');
    try {
      await adminAPI.deletePortfolio(portfolioId);
      setSuccess('Portfolio has been successfully soft-deleted/moderated.');
      // remove from view list
      setPortfolios(portfolios.filter(p => p._id !== portfolioId));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to moderate portfolio.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Moderation Desk</h2>
          <p className="text-xs text-slate-400">Moderate spam layouts and inspect user deployments ({totalPortfolios} active portfolios)</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title..."
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
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <Globe className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-880 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="text-xs">Fetching portfolios...</span>
          </div>
        ) : portfolios.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            No portfolios found matching your search term.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="px-5 py-4">Portfolio Title</th>
                  <th className="px-5 py-4">Author Owner</th>
                  <th className="px-5 py-4">Theme Engine</th>
                  <th className="px-5 py-4 text-center">ATS Score</th>
                  <th className="px-5 py-4">Created Date</th>
                  <th className="px-5 py-4 text-right">Moderator Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {portfolios.map((item) => {
                  const hasDeploy = !!item.deploymentUrl;
                  const isMutating = actionLoading === item._id;

                  return (
                    <tr key={item._id} className="hover:bg-slate-900/35 transition-colors text-slate-200">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100">{item.title || 'Untitled Portfolio'}</span>
                          {hasDeploy ? (
                            <a
                              href={item.deploymentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Globe className="w-3 h-3" />
                              View Deployed Layout
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500">No deployment active</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.userId?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=DF'}
                            alt={item.userId?.name || 'User'}
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-350">{item.userId?.name || 'Unknown'}</span>
                            <span className="text-[9px] text-slate-500">{item.userId?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 font-mono text-indigo-400 font-bold text-[10px]">
                          {item.theme || 'DarkPro'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded font-mono font-bold text-[10px] ${item.score?.overall >= 80 ? 'text-emerald-400 bg-emerald-500/10' : item.score?.overall >= 60 ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-950'}`}>
                          {item.score?.overall || 0}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleSoftDelete(item._id)}
                          disabled={isMutating}
                          className="p-1.5 rounded-lg border border-red-900/40 bg-red-950/20 hover:bg-red-900/20 text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Moderate Portfolio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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
