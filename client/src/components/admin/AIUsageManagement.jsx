import React, { useState, useEffect } from 'react';
import { Cpu, DollarSign, RefreshCw, Zap, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function AIUsageManagement() {
  const [data, setData] = useState(null);
  const [cacheData, setCacheData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAIDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [usageRes, cacheRes] = await Promise.all([
        adminAPI.getAIUsage(),
        adminAPI.getCacheStats()
      ]);
      setData(usageRes.data);
      setCacheData(cacheRes.data);
    } catch (err) {
      setError('Failed to fetch detailed AI diagnostic telemetry logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIDetails();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="text-xs">Compiling telemetry diagnostics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  // Draw simple SVG line chart from trend points
  const drawTrendChart = () => {
    const trend = data?.usageTrend || [];
    if (trend.length === 0) return null;

    const maxRequests = Math.max(...trend.map(t => t.requests), 5);
    const height = 120;
    const width = 500;
    const padding = 15;

    const points = trend.map((t, idx) => {
      const x = padding + (idx * (width - 2 * padding)) / Math.max(1, trend.length - 1);
      const y = height - padding - (t.requests * (height - 2 * padding)) / maxRequests;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-32 text-indigo-500" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="1" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeWidth="1" />

        {/* Gradient fill */}
        {trend.length > 1 && (
          <path
            d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
            fill="url(#gradient)"
          />
        )}
        
        {/* Trend Line */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          points={points}
        />

        {/* Data points */}
        {trend.map((t, idx) => {
          const x = padding + (idx * (width - 2 * padding)) / Math.max(1, trend.length - 1);
          const y = height - padding - (t.requests * (height - 2 * padding)) / maxRequests;
          return (
            <g key={idx} className="group">
              <circle
                cx={x}
                cy={y}
                r="4"
                className="fill-slate-950 stroke-indigo-400 stroke-2 hover:r-6 hover:fill-indigo-400 transition-all cursor-pointer"
              />
              <title>{`${t._id}: ${t.requests} requests, ${t.tokens.toLocaleString()} tokens`}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">AI Cost Diagnostics</h2>
          <p className="text-xs text-slate-400">Track Gemini 1.5 token expenditures and response cache efficiency</p>
        </div>
        
        <button
          onClick={fetchAIDetails}
          className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/50 border border-slate-880 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Tokens</span>
            <span className="text-lg font-black text-slate-100">{(data?.totalTokens || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-880 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/15">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estimated Costs</span>
            <span className="text-lg font-black text-slate-100">${(data?.estimatedCost || 0).toFixed(4)}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-880 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cache Hits</span>
            <span className="text-lg font-black text-slate-100">{cacheData?.cacheHits || 0}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-880 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/15">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estimated Savings</span>
            <span className="text-lg font-black text-slate-100">${(cacheData?.estimatedSavings || 0).toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Diagnostic insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Card */}
        <div className="lg:col-span-2 p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Traffic (Last 14 Days)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Telemetry trend for model request executions</p>
          </div>
          
          <div className="bg-slate-950/60 p-4 border border-slate-880 rounded-xl flex items-center justify-center">
            {data?.usageTrend && data.usageTrend.length > 0 ? (
              drawTrendChart()
            ) : (
              <span className="text-xs text-slate-500 py-10">No recent request activities recorded</span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 border-t border-slate-850 pt-3">
            <span>Average tokens / request: <strong className="text-slate-350">{data?.averageTokensPerReq || 0}</strong></span>
            <span>Total cache hit rate: <strong className="text-indigo-400">{cacheData?.cacheHitRate || 0}%</strong></span>
          </div>
        </div>

        {/* Feature breakdown card */}
        <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feature Usage Distribution</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Token cost density grouped by module</p>
          </div>

          <div className="flex-grow flex flex-col divide-y divide-slate-850 overflow-y-auto max-h-[220px] pr-1.5">
            {data?.featureBreakdown && data.featureBreakdown.length > 0 ? (
              data.featureBreakdown.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200 font-mono capitalize">{item._id.replace('-', ' ')}</span>
                    <span className="text-[10px] text-slate-500">{item.requests} calls made</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-100">{item.tokens.toLocaleString()} tokens</span>
                    <span className="text-[9px] text-slate-500 font-mono">${((item.tokens / 1000000) * 0.20).toFixed(4)} spent</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-500">No feature usage recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
