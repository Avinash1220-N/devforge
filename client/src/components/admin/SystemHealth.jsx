import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Cpu, Server, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../utils/api';

export default function SystemHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHealth = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getSystemHealth();
      setData(res.data);
    } catch (err) {
      setError('Failed to poll system telemetry health reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.join(' ');
  };

  const getLatencyColor = (ms) => {
    if (ms === -1) return 'text-red-400 border-red-500/20 bg-red-500/10';
    if (ms < 100) return 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10';
    if (ms < 400) return 'text-amber-400 border-amber-500/25 bg-amber-500/10';
    return 'text-red-450 border-red-500/25 bg-red-500/10';
  };

  const getLatencyLabel = (ms) => {
    if (ms === -1) return 'Offline';
    if (ms < 100) return 'Optimal';
    if (ms < 400) return 'Degraded';
    return 'Critical';
  };

  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="text-xs">Polling system latency logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Telemetry Health Checks</h2>
          <p className="text-xs text-slate-400">Real-time latency averages and runtime process health diagnostics (Auto-polls every 30s)</p>
        </div>

        <button
          onClick={fetchHealth}
          className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Poll Node
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Latency breakouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Database latency card */}
        <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MongoDB Latency</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">{data?.mongoLatency || 0}</span>
            <span className="text-xs text-slate-500 font-bold">ms</span>
          </div>

          <div className={`p-2 border rounded-lg text-center font-bold text-[10px] uppercase ${getLatencyColor(data?.mongoLatency)}`}>
            {getLatencyLabel(data?.mongoLatency)}
          </div>
        </div>

        {/* GitHub integration latency card */}
        <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">GitHub API Latency</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">{data?.githubLatency === -1 ? '—' : data?.githubLatency}</span>
            {data?.githubLatency !== -1 && <span className="text-xs text-slate-500 font-bold">ms</span>}
          </div>

          <div className={`p-2 border rounded-lg text-center font-bold text-[10px] uppercase ${getLatencyColor(data?.githubLatency)}`}>
            {getLatencyLabel(data?.githubLatency)}
          </div>
        </div>

        {/* Gemini inference latency card */}
        <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gemini Avg Inference</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">{data?.geminiAvgLatency || 0}</span>
            <span className="text-xs text-slate-500 font-bold">ms</span>
          </div>

          <div className={`p-2 border rounded-lg text-center font-bold text-[10px] uppercase ${getLatencyColor(data?.geminiAvgLatency)}`}>
            {getLatencyLabel(data?.geminiAvgLatency)}
          </div>
        </div>
      </div>

      {/* Runtime Details */}
      <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Runtime Diagnostics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-350">
          <div className="p-4 bg-slate-950/60 border border-slate-880 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Process Uptime:</span>
              <span className="text-slate-100">{formatUptime(data?.uptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Node.js Version:</span>
              <span className="text-slate-100">{window.navigator.userAgent.includes('Electron') ? 'Electron Runtime' : 'Node v18+'}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-880 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Memory (RSS):</span>
              <span className="text-slate-100">
                {data?.memoryUsage?.rss ? `${Math.round(data.memoryUsage.rss / 1024 / 1024)} MB` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Memory (Heap Used):</span>
              <span className="text-slate-100">
                {data?.memoryUsage?.heapUsed ? `${Math.round(data.memoryUsage.heapUsed / 1024 / 1024)} MB` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
