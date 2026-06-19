import React, { useState, useEffect } from 'react';
import { Eye, MousePointerClick, Download, MessageSquare, Trophy, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function AnalyticsManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getAnalytics();
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch platform engagement analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="text-xs">Collating visitor metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const summary = data?.summary || { views: 0, clicks: 0, downloads: 0, contactSubmissions: 0 };
  const leaderboard = data?.leaderboard || [];
  const deviceBreakdown = data?.deviceBreakdown || [];
  const countryBreakdown = data?.countryBreakdown || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Visitor Engagement</h2>
          <p className="text-xs text-slate-400">Monitor traffic, document downloads, and popular developer portfolio leaders</p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* Engagement Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/50 border border-slate-880 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15">
            <Eye className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Views</span>
            <span className="text-lg font-black text-slate-100">{summary.views.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-880 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/15">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GitHub Clicks</span>
            <span className="text-lg font-black text-slate-100">{summary.clicks.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-880 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/15">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PDF Downloads</span>
            <span className="text-lg font-black text-slate-100">{summary.downloads.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-880 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inquiries Sent</span>
            <span className="text-lg font-black text-slate-100">{summary.contactSubmissions.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard Table */}
        <div className="lg:col-span-2 p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Portfolios Leaderboard</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Ranked by overall views and score quality</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {leaderboard.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">No portfolio views tracked yet.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase tracking-wider pb-2">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Author</th>
                    <th className="pb-3 text-center">ATS Match</th>
                    <th className="pb-3 text-right">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {leaderboard.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/10">
                      <td className="py-3 font-bold text-slate-200">{item.title}</td>
                      <td className="py-3 text-slate-400">{item.owner}</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 font-mono text-[10px] text-indigo-400 font-bold">
                          {item.score || 0}%
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-slate-100">{item.views.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Breakouts Card */}
        <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col gap-5">
          {/* Devices breakdown */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Device Breakout</h4>
            <div className="space-y-2">
              {deviceBreakdown.length === 0 ? (
                <p className="text-[10px] text-slate-600">No device events recorded</p>
              ) : (
                deviceBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-350">{item._id || 'Unknown'}</span>
                    <span className="font-bold text-slate-150">{item.count} events</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-850"></div>

          {/* Countries breakdown */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top Visitor Geographies</h4>
            <div className="space-y-2">
              {countryBreakdown.length === 0 ? (
                <p className="text-[10px] text-slate-600">No country events recorded</p>
              ) : (
                countryBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-350">{item._id || 'Unknown'}</span>
                    <span className="font-bold text-slate-150">{item.count} events</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
