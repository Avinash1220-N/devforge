import React, { useState, useEffect } from 'react';
import { 
  Users, Globe, Cpu, Activity, History, ArrowLeft, 
  LogOut, Shield, Sparkles, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { adminAPI } from '../../utils/api';
import UsersManagement from './UsersManagement';
import PortfoliosManagement from './PortfoliosManagement';
import AIUsageManagement from './AIUsageManagement';
import AnalyticsManagement from './AnalyticsManagement';
import SystemHealth from './SystemHealth';
import AdminAuditLogs from './AdminAuditLogs';

export default function AdminDashboard({ user, backToWorkspace, handleLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'portfolios' | 'ai' | 'analytics' | 'health' | 'audit'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      setError('Failed to fetch platform metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-900 bg-slate-950 px-4 flex items-center justify-between sticky top-0 z-45">
        <div className="flex items-center gap-3">
          <button 
            onClick={backToWorkspace}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-850 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Workspace
          </button>
          
          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block"></div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span className="font-extrabold tracking-wider text-base text-slate-100 hidden sm:inline">Admin Console</span>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 py-0.5 px-2 rounded-full font-bold">Platform Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Super Administrator</span>
          </div>
          {user?.avatarUrl && (
            <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-800" />
          )}
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 border border-slate-850 rounded-lg transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-grow flex flex-col md:flex-row">
        
        {/* Left Side Tab Navigation */}
        <aside className="w-full md:w-64 border-r border-slate-900 bg-slate-950 p-4 space-y-2 flex-shrink-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Systems Controls</div>
          
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'overview' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <Activity className="w-4 h-4" />
            Overview Dashboard
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'users' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <Users className="w-4 h-4" />
            User Directory
          </button>

          <button 
            onClick={() => setActiveTab('portfolios')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'portfolios' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <Globe className="w-4 h-4" />
            Moderation Desk
          </button>

          <button 
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'ai' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <Cpu className="w-4 h-4" />
            AI Cost Analytics
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'analytics' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <Activity className="w-4 h-4" />
            Visitor Engagement
          </button>

          <button 
            onClick={() => setActiveTab('health')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'health' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <Activity className="w-4 h-4" />
            Telemetry Health
          </button>

          <button 
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'audit' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
          >
            <History className="w-4 h-4" />
            Audit Security Logs
          </button>
        </aside>

        {/* Dynamic Display Panel */}
        <main className="flex-grow p-6 bg-slate-950 overflow-y-auto max-h-[calc(100vh-4rem)]">
          
          {/* TAB: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-100">Overview Dashboard</h2>
                  <p className="text-xs text-slate-400">At-a-glance ecosystem growth indexes and performance summaries</p>
                </div>
                
                <button
                  onClick={fetchStats}
                  className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-slate-350 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  <span className="text-xs">Assembling dashboard summaries...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Total Users */}
                  <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col gap-3 shadow-md hover:border-slate-750 transition-all">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">User Base Growth</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-3xl font-black text-slate-100">{stats?.users?.total || 0}</span>
                      <span className="text-xs text-indigo-400 font-bold">+{stats?.users?.today || 0} today</span>
                    </div>
                    <span className="text-[10px] text-slate-500 border-t border-slate-850 pt-2.5">
                      +{stats?.users?.thisWeek || 0} joined this week
                    </span>
                  </div>

                  {/* Total Portfolios */}
                  <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col gap-3 shadow-md hover:border-slate-750 transition-all">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Portfolios Generated</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-3xl font-black text-slate-100">{stats?.portfolios?.total || 0}</span>
                      <span className="text-xs text-indigo-400 font-bold">+{stats?.portfolios?.today || 0} today</span>
                    </div>
                    <span className="text-[10px] text-slate-500 border-t border-slate-850 pt-2.5">
                      Active public portfolios in directories
                    </span>
                  </div>

                  {/* Cache Efficiency */}
                  <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col gap-3 shadow-md hover:border-slate-750 transition-all">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Cache Efficiency</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-3xl font-black text-slate-100">{stats?.ai?.cacheHitRate || 0}%</span>
                      <span className="text-xs text-emerald-400 font-bold">Optimal</span>
                    </div>
                    <span className="text-[10px] text-slate-500 border-t border-slate-850 pt-2.5">
                      Across {stats?.ai?.requests || 0} total model calls
                    </span>
                  </div>

                  {/* Active Users */}
                  <div className="p-5 bg-slate-900/40 border border-slate-880 rounded-2xl flex flex-col gap-3 shadow-md hover:border-slate-750 transition-all">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Operations</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-3xl font-black text-slate-100">{stats?.activity?.dau || 0}</span>
                      <span className="text-xs text-slate-400 font-bold">DAU</span>
                    </div>
                    <span className="text-[10px] text-slate-500 border-t border-slate-850 pt-2.5">
                      Monthly active operations (MAU): <strong className="text-indigo-450">{stats?.activity?.mau || 0}</strong>
                    </span>
                  </div>

                </div>
              )}

              {/* Fast links desk */}
              <div className="bg-slate-900/20 border border-slate-880 rounded-2xl p-5 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-450" />
                  Ecosystem Management Panel Instructions
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Welcome to the DevForge Administration Dashboard. From here you can inspect all system telemetry monitors, check cache savings, deactivate spam users or portfolios, and review security logs. All actions performed are logged in the immutable administrative security register.
                </p>
              </div>
            </div>
          )}

          {/* TAB: USERS DIRECTORY */}
          {activeTab === 'users' && <UsersManagement currentUser={user} />}

          {/* TAB: MODERATION DESK */}
          {activeTab === 'portfolios' && <PortfoliosManagement />}

          {/* TAB: AI COST ANALYTICS */}
          {activeTab === 'ai' && <AIUsageManagement />}

          {/* TAB: VISITOR ENGAGEMENT */}
          {activeTab === 'analytics' && <AnalyticsManagement />}

          {/* TAB: TELEMETRY HEALTH */}
          {activeTab === 'health' && <SystemHealth />}

          {/* TAB: AUDIT LOGS */}
          {activeTab === 'audit' && <AdminAuditLogs />}

        </main>
      </div>
    </div>
  );
}
