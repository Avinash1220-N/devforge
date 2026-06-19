import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Code, Globe, Shield, RefreshCw, LogOut, Lock, 
  Sparkles, CheckCircle2, AlertCircle, Play, Eye, EyeOff,
  Layout, MessageSquare, History, Check, ArrowRight,
  Bold, Italic, Heading, Link, List, FileCode, CheckSquare,
  Smartphone, Monitor, ChevronRight
} from 'lucide-react';
import { authAPI, githubAPI, portfolioAPI, deployAPI, aiAPI } from './utils/api';
import { buildPortfolioHtml } from './utils/templateBuilder';
import AdminDashboard from './components/admin/AdminDashboard';

// Custom inline SVG components to prevent bundler export discrepancies
const Github = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Brain = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
  </svg>
);

const Upload = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const TrendingUp = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const Target = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export default function App() {
  // Navigation & User State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); // 'login' | 'workspace'
  
  // Mock login inputs
  const [mockUser, setMockUser] = useState('');
  const [mockRole, setMockRole] = useState('user');
  
  // Portfolio States
  const [portfolio, setPortfolio] = useState(null);
  const [markdown, setMarkdown] = useState('');
  const [theme, setTheme] = useState('DarkPro');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // GitHub Import States
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [repoError, setRepoError] = useState('');
  const [repoAISummarizingId, setRepoAISummarizingId] = useState(null);

  // Deployment States
  const [repoName, setRepoName] = useState('devforge-portfolio');
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState('');
  const [deployError, setDeployError] = useState('');

  // Active Control Tab
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'themes' | 'github' | 'versions' | 'messages' | 'coach'

  // History & Messages
  const [versions, setVersions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Viewport mode for Iframe Preview
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'mobile'

  // --- PHASE 2 AI STATE VARIABLES ---
  
  // Resume Parsing
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [parsedProfile, setParsedProfile] = useState(null);
  const [parsedMarkdownResult, setParsedMarkdownResult] = useState('');

  // ATS suitability
  const [jobDescription, setJobDescription] = useState('');
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsResult, setAtsResult] = useState(null);

  // Career coach
  const [targetRole, setTargetRole] = useState('Machine Learning Engineer');
  const [careerLoading, setCareerLoading] = useState(false);
  const [careerResult, setCareerResult] = useState(null);

  // Score Grader
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);

  // Selection Rewriter
  const [rewriteInput, setRewriteInput] = useState('');
  const [rewriteRole, setRewriteRole] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [rewriteOutput, setRewriteOutput] = useState('');

  const textareaRef = useRef(null);

  // 1. Initial auth checks
  useEffect(() => {
    // Check if redirecting back from GitHub OAuth
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const oauthError = params.get('error');

    if (window.location.pathname === '/auth-success' || status || oauthError) {
      if (status === 'success') {
        fetchCurrentUser();
      } else {
        setLoading(false);
        setView('login');
        if (oauthError) alert('GitHub Authentication failed: ' + oauthError);
      }
      window.history.replaceState({}, document.title, "/");
      return;
    }

    fetchCurrentUser();
  }, []);

  // Fetch logged in profile
  const fetchCurrentUser = async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data.user);
      setView('workspace');
      loadPortfolio();
    } catch (err) {
      setUser(null);
      setView('login');
    } finally {
      setLoading(false);
    }
  };

  // Load portfolio markdown
  const loadPortfolio = async () => {
    try {
      const res = await portfolioAPI.getMine();
      setPortfolio(res.data);
      setMarkdown(res.data.markdown);
      setTheme(res.data.theme || 'DarkPro');
      setTitle(res.data.title || 'My Developer Portfolio');
      setVersions(res.data.versions || []);
      if (res.data.deploymentUrl) {
        setDeployUrl(res.data.deploymentUrl);
      }
      if (res.data.githubRepoName) {
        setRepoName(res.data.githubRepoName);
      }
      if (res.data.parsedData) {
        setParsedProfile(res.data.parsedData);
      }
      
      // Load historical audits
      loadAuditHistory(res.data._id);
    } catch (err) {
      console.error('Failed to load portfolio details:', err);
    }
  };

  // Load audit logs history
  const loadAuditHistory = async (portfolioId) => {
    if (!portfolioId) return;
    try {
      const res = await aiAPI.getAudits(portfolioId);
      setAuditHistory(res.data.audits || []);
    } catch (err) {
      console.error('Failed to retrieve audit history:', err);
    }
  };

  // Load messages
  const loadMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await portfolioAPI.getMessages();
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load contact messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Load GitHub repos
  const loadGitHubRepos = async () => {
    setReposLoading(true);
    setRepoError('');
    try {
      const res = await githubAPI.fetchRepos();
      setRepos(res.data.repos || []);
      setGithubUsername(res.data.username || '');
    } catch (err) {
      setRepoError('Make sure your GitHub account is linked, or use Mock Login.');
      console.error('Failed to load GitHub repos:', err);
    } finally {
      setReposLoading(false);
    }
  };

  // Load Tab Content dynamically
  useEffect(() => {
    if (view === 'workspace') {
      if (activeTab === 'messages') {
        loadMessages();
      } else if (activeTab === 'github' && repos.length === 0) {
        loadGitHubRepos();
      }
    }
  }, [activeTab, view]);

  // Handle saving portfolio
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await portfolioAPI.save({ markdown, theme, title });
      setPortfolio(res.data);
      setVersions(res.data.versions || []);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save portfolio progress.');
    } finally {
      setSaving(false);
    }
  };

  // Rollback to prior version
  const handleRollback = async (versionId) => {
    if (!window.confirm('Are you sure you want to rollback to this version? Your current edits will be saved as a checkpoint.')) return;
    try {
      const res = await portfolioAPI.rollback(versionId);
      setPortfolio(res.data);
      setMarkdown(res.data.markdown);
      setVersions(res.data.versions || []);
      alert('Rollback successful!');
    } catch (err) {
      alert('Rollback failed.');
    }
  };

  // Trigger One-Click Deploy
  const handleDeploy = async () => {
    setDeploying(true);
    setDeployError('');
    try {
      const htmlContent = buildPortfolioHtml(markdown, theme, portfolio?._id, 'http://localhost:5000');
      const res = await deployAPI.deployGitHubPages(portfolio._id, repoName, htmlContent, theme);
      setDeployUrl(res.data.url);
      alert('Portfolio successfully deployed to GitHub Pages!');
    } catch (err) {
      setDeployError(err.response?.data?.message || 'Deployment to GitHub Pages failed.');
    } finally {
      setDeploying(false);
    }
  };

  // Real-time compilation preview
  const getPreviewSource = () => {
    return buildPortfolioHtml(markdown, theme, portfolio?._id || 'mock_id', 'http://localhost:5000');
  };

  // --- PHASE 2 AI ROUTINE HANDLERS ---

  // Upload and parse resume PDF
  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      alert('Please select a PDF resume file first.');
      return;
    }

    setResumeParsing(true);
    setParsedProfile(null);
    setParsedMarkdownResult('');
    
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      const res = await aiAPI.parseResume(formData);
      setParsedProfile(res.data.parsedData);
      alert('Resume parsed successfully! You can now generate your portfolio layout.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Resume parsing failed. Verify the file size (limit: 5MB) and type.');
    } finally {
      setResumeParsing(false);
    }
  };

  // Generate portfolio markdown from parsed JSON
  const handleGeneratePortfolio = async () => {
    setResumeParsing(true);
    try {
      const res = await aiAPI.generatePortfolio();
      setMarkdown(res.data.markdown);
      setTheme('DarkPro'); // default nice dark theme
      
      // Auto save
      await portfolioAPI.save({ markdown: res.data.markdown, theme: 'DarkPro', title });
      alert('Portfolio markdown generated and inserted into the editor!');
    } catch (err) {
      alert('Failed to generate portfolio from parsed details.');
    } finally {
      setResumeParsing(false);
    }
  };

  // GitHub AI repository summarizer
  const handleGitHubAISummarize = async (repo) => {
    setRepoAISummarizingId(repo.id);
    try {
      // Step 1: Read README if available
      let readme = '';
      try {
        const readmeRes = await githubAPI.fetchReadme(githubUsername, repo.name);
        readme = readmeRes.data.readme || '';
      } catch (readmeErr) {
        console.warn('README not found, proceeding with repository metadata.');
      }

      // Step 2: Call project summarizer endpoint
      const res = await aiAPI.projectSummary({
        name: repo.name,
        description: repo.description,
        readme,
        topics: repo.topics || [],
        languages: [repo.language || 'Software']
      });

      const card = res.data.project;
      const projectMD = `\n### ${card.title}\n${card.summary}\n- **Tech**: ${card.technologies.join(', ')}\n- [GitHub Repository](${repo.html_url})\n`;
      
      insertText(projectMD);
      alert(`AI summarized and imported "${card.title}" successfully!`);
    } catch (err) {
      alert('AI Summarization failed. Appending raw project details instead.');
      const projectMD = `\n### ${repo.name}\n${repo.description || 'Developed a public software utility.'}\n- **Tech**: ${repo.language || 'Software'}, GitHub API\n- [GitHub Repository](${repo.html_url})\n`;
      insertText(projectMD);
    } finally {
      setRepoAISummarizingId(null);
    }
  };

  // ATS compatibility scorer
  const handleATSCheck = async () => {
    if (!jobDescription.trim()) {
      alert('Please paste a target Job Description to check against.');
      return;
    }

    setAtsLoading(true);
    setAtsResult(null);
    try {
      const res = await aiAPI.atsScore(markdown, jobDescription);
      setAtsResult(res.data.analysis);
    } catch (err) {
      alert('ATS score evaluation failed.');
    } finally {
      setAtsLoading(false);
    }
  };

  // Career role coach
  const handleCareerCheck = async () => {
    if (!targetRole.trim()) return;

    setCareerLoading(true);
    setCareerResult(null);

    // Extract current skills from profile parsedData, or do a rough extract from markdown
    const skillsList = parsedProfile?.skills || ['Python', 'React', 'JavaScript', 'Node.js'];

    try {
      const res = await aiAPI.careerFit(skillsList, targetRole);
      setCareerResult(res.data.analysis);
    } catch (err) {
      alert('Career role fit evaluation failed.');
    } finally {
      setCareerLoading(false);
    }
  };

  // Run Portfolio scoring audit
  const handleScoreAudit = async () => {
    if (!portfolio) return;
    setScoreLoading(true);
    setScoreResult(null);
    try {
      const res = await aiAPI.portfolioScore(portfolio._id, markdown);
      setScoreResult(res.data.audit);
      
      // Reload audit history
      loadAuditHistory(portfolio._id);
    } catch (err) {
      alert('Portfolio scoring audit failed.');
    } finally {
      setScoreLoading(false);
    }
  };

  // Text Selection Rewriter
  const handleTextRewrite = async () => {
    if (!rewriteInput.trim()) {
      alert('Please enter a sentence or paragraph to rewrite.');
      return;
    }

    setRewriting(true);
    setRewriteOutput('');
    try {
      const res = await aiAPI.rewrite(rewriteInput, rewriteRole);
      setRewriteOutput(res.data.rewrittenText);
    } catch (err) {
      alert('Text rewriting failed.');
    } finally {
      setRewriting(false);
    }
  };

  // Auth logins
  const handleGitHubLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/github/callback';
  };

  const handleMockLogin = async (e) => {
    e.preventDefault();
    if (!mockUser.trim()) return;
    setLoading(true);
    try {
      const res = await authAPI.mockLogin(mockUser, mockRole);
      setUser(res.data.user);
      setView('workspace');
      loadPortfolio();
    } catch (err) {
      alert('Mock login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setView('login');
      setPortfolio(null);
      setMarkdown('');
      setRepos([]);
      setVersions([]);
    } catch (err) {
      alert('Logout failed');
    }
  };

  // Markdown Toolbar helper injection
  const insertText = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;

    setMarkdown(text.substring(0, start) + replacement + text.substring(end));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  const injectTemplate = (type) => {
    if (type === 'project') {
      insertText('\n### Project Name\nA professional detailed description of the project, specifying its impact and problem solved.\n- **Tech**: React.js, Tailwind CSS, Firebase\n- [GitHub Repository](https://github.com/your-username/repo-name)\n');
    } else if (type === 'skills') {
      insertText('\n## Skills\n- Languages: JavaScript, Python, C++\n- Frameworks: React, Node.js, Express\n- Cloud & Database: AWS, MongoDB, Docker\n');
    } else if (type === 'experience') {
      insertText('\n### Software Engineer Intern\nGoogle - Duration: Jan 2026 - Present\n- Built real-time developer metrics dashboards using React and D3.js.\n- Automated deployment workflows, cutting container release times by 30%.\n- Collaborated with 5 core engineers to debug REST interface bottlenecks.\n');
    }
  };

  // --- RENDERS ---

  if (loading) {
    return (
      <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <div class="relative flex items-center justify-center">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          <Sparkles class="absolute w-6 h-6 text-indigo-400 animate-pulse" />
        </div>
        <h2 class="text-xl font-bold tracking-wider text-slate-200 mt-6">DevForge AI</h2>
        <p class="text-sm text-slate-500 mt-1">Bootstrapping portfolio generator environment...</p>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 relative overflow-hidden font-sans">
        <div class="absolute top-1/4 left-1/4 -z-10 w-[500px] h-[500px] bg-purple-900/10 rounded-full filter blur-[100px] animate-pulse-slow"></div>
        <div class="absolute bottom-1/4 right-1/4 -z-10 w-[400px] h-[400px] bg-indigo-900/10 rounded-full filter blur-[100px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

        <div class="max-w-md w-full bg-slate-900/50 backdrop-blur-md border border-slate-880 rounded-3xl p-8 shadow-2xl animate-fade-in">
          <div class="text-center mb-8">
            <div class="inline-flex p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-3 animate-float">
              <Sparkles class="w-8 h-8" />
            </div>
            <h1 class="text-3xl font-extrabold tracking-tight">DevForge AI</h1>
            <p class="text-sm text-slate-400 mt-2">Intelligent Developer Portfolio Ecosystem</p>
          </div>

          <button 
            onClick={handleGitHubLogin}
            class="w-full bg-white hover:bg-slate-105 text-slate-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md cursor-pointer"
          >
            <Github class="w-5 h-5 text-slate-950" />
            Connect via GitHub Account
          </button>

          <div class="flex items-center gap-3 my-6">
            <div class="flex-grow h-[1px] bg-slate-800"></div>
            <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">OR DEVELOPER TEST MODE</span>
            <div class="flex-grow h-[1px] bg-slate-800"></div>
          </div>

          <form onSubmit={handleMockLogin} class="space-y-4">
            <div>
              <label htmlFor="mockName" class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Simulated Username</label>
              <div class="relative">
                <Github class="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  id="mockName"
                  value={mockUser}
                  onChange={(e) => setMockUser(e.target.value)}
                  placeholder="e.g. avinash" 
                  class="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none text-slate-100 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Dashboard Access Role</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMockRole('user')}
                  class={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${mockRole === 'user' ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'}`}
                >
                  Developer User
                </button>
                <button
                  type="button"
                  onClick={() => setMockRole('admin')}
                  class={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${mockRole === 'admin' ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'}`}
                >
                  Admin Manager
                </button>
              </div>
            </div>

            <button 
              type="submit"
              class="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              Bypass Login (Enter Dashboard)
              <ArrowRight class="w-4 h-4" />
            </button>
          </form>

          <div class="mt-6 flex items-start gap-2 bg-slate-950/40 p-3.5 border border-slate-850 rounded-xl text-[11px] text-slate-400">
            <Shield class="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>AI services will execute in Simulation Mode using mock values if a mock key is configured inside server .env settings.</span>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <AdminDashboard 
        user={user} 
        backToWorkspace={() => setView('workspace')} 
        handleLogout={handleLogout}
      />
    );
  }

  return (
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      <header class="h-16 border-b border-slate-900 bg-slate-950 px-4 flex items-center justify-between sticky top-0 z-45">
        <div class="flex items-center gap-3">
          <div class="p-1.5 bg-indigo-600/15 border border-indigo-500/25 rounded-lg text-indigo-400">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <span class="font-extrabold tracking-wider text-base text-slate-100">DevForge AI</span>
            <span class="ml-2 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-450 py-0.5 px-2 rounded-full font-bold">Phase 2 Enabled</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          {user?.role === 'admin' && (
            <button
              onClick={() => setView('admin')}
              class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.15)]"
            >
              <Shield class="w-3.5 h-3.5" />
              Admin Console
            </button>
          )}
          <div class="hidden sm:flex flex-col text-right">
            <span class="text-xs font-semibold text-slate-200">{user?.name}</span>
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{user?.role} Mode</span>
          </div>
          {user?.avatarUrl && (
            <img src={user.avatarUrl} alt="Avatar" class="w-8 h-8 rounded-full border border-slate-800" />
          )}
          <button 
            onClick={handleLogout}
            class="p-2 text-slate-400 hover:text-red-400 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 rounded-lg transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut class="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      <div class="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Editor & Controls Workspace */}
        <div class="w-full lg:w-[45%] border-r border-slate-900 flex flex-col bg-slate-950">
          
          {/* Dashboard Tab Buttons */}
          <div class="flex border-b border-slate-900 bg-slate-950 overflow-x-auto select-none no-scrollbar">
            <button 
              onClick={() => setActiveTab('editor')}
              class={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'editor' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <FileText class="w-4 h-4" />
              Markdown Editor
            </button>
            <button 
              onClick={() => setActiveTab('coach')}
              class={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'coach' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-450 hover:text-slate-250'}`}
            >
              <Brain class="w-4 h-4 text-indigo-400" />
              AI Coach
            </button>
            <button 
              onClick={() => setActiveTab('themes')}
              class={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'themes' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Layout class="w-4 h-4" />
              Theme Engine
            </button>
            <button 
              onClick={() => setActiveTab('github')}
              class={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'github' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Github class="w-4 h-4" />
              GitHub Import
            </button>
            <button 
              onClick={() => setActiveTab('versions')}
              class={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'versions' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <History class="w-4 h-4" />
              Versions
            </button>
            <button 
              onClick={() => setActiveTab('messages')}
              class={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'messages' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <MessageSquare class="w-4 h-4" />
              Inbox
            </button>
          </div>

          {/* Active Tab Panel Frame */}
          <div class="flex-grow p-4 overflow-y-auto max-h-[calc(100vh-17.5rem)] lg:max-h-[calc(100vh-16rem)]">
            
            {/* TAB: EDITOR */}
            {activeTab === 'editor' && (
              <div class="h-full flex flex-col gap-3">
                <div class="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2 border border-slate-850 rounded-xl">
                  <div class="flex items-center gap-1.5">
                    <button onClick={() => insertText('**', '**')} class="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-250 transition-colors" title="Bold"><Bold class="w-4 h-4" /></button>
                    <button onClick={() => insertText('*', '*')} class="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-250 transition-colors" title="Italic"><Italic class="w-4 h-4" /></button>
                    <button onClick={() => insertText('### ', '')} class="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-250 transition-colors" title="Header 3"><Heading class="w-4 h-4" /></button>
                    <button onClick={() => insertText('[', '](https://)')} class="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-250 transition-colors" title="Link"><Link class="w-4 h-4" /></button>
                    <button onClick={() => insertText('- ', '')} class="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-250 transition-colors" title="List"><List class="w-4 h-4" /></button>
                  </div>

                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="text-[9px] font-bold text-slate-500 uppercase">Inject:</span>
                    <button onClick={() => injectTemplate('skills')} class="px-2 py-0.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded text-slate-300 font-semibold">Skills</button>
                    <button onClick={() => injectTemplate('project')} class="px-2 py-0.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded text-slate-300 font-semibold">Project</button>
                    <button onClick={() => injectTemplate('experience')} class="px-2 py-0.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded text-slate-300 font-semibold">Job</button>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label htmlFor="portfolioTitle" class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Portfolio Title</label>
                  <input
                    type="text"
                    id="portfolioTitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Avinash - AI Engineer Showcase"
                    class="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-lg p-2 text-sm focus:outline-none text-slate-100"
                  />
                </div>

                <div class="flex-grow flex flex-col gap-1.5">
                  <label htmlFor="markdownTextarea" class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Markdown Content</span>
                    <span class="text-indigo-400 font-mono text-[9px]">Live Preview Link Active</span>
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="markdownTextarea"
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    placeholder="# Your Name..."
                    class="w-full flex-grow min-h-[250px] max-h-[420px] bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl p-4 text-sm font-mono focus:outline-none text-slate-200 leading-relaxed overflow-y-auto"
                  ></textarea>
                </div>

                {/* Inline AI rewriter toolkit */}
                <div class="bg-slate-900/40 p-3.5 border border-slate-880 rounded-xl flex flex-col gap-2">
                  <span class="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Brain class="w-3 h-3" />
                    AI Text Enhancer (Sentence Rewriter)
                  </span>
                  
                  <div class="flex gap-2">
                    <input 
                      type="text"
                      value={rewriteInput}
                      onChange={(e) => setRewriteInput(e.target.value)}
                      placeholder="e.g. Built a website using React"
                      class="flex-grow bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-lg p-2 text-xs focus:outline-none text-slate-250"
                    />
                    <input 
                      type="text"
                      value={rewriteRole}
                      onChange={(e) => setRewriteRole(e.target.value)}
                      placeholder="Role (e.g. Frontend)"
                      class="w-24 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-lg p-2 text-xs focus:outline-none text-slate-250"
                    />
                    <button
                      type="button"
                      onClick={handleTextRewrite}
                      disabled={rewriting || !rewriteInput}
                      class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      {rewriting ? 'Enhancing...' : 'Enhance'}
                    </button>
                  </div>

                  {rewriteOutput && (
                    <div class="bg-slate-950/80 p-3 border border-slate-850 rounded-lg flex flex-col gap-2 mt-1 animate-fade-in">
                      <p class="text-xs text-slate-350 leading-relaxed italic">"{rewriteOutput}"</p>
                      <button
                        type="button"
                        onClick={() => {
                          insertText(rewriteOutput);
                          setRewriteOutput('');
                          setRewriteInput('');
                        }}
                        class="self-end text-[10px] text-indigo-400 hover:underline font-bold"
                      >
                        Insert into Editor
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: AI COACH (Phase 2 Command Console) */}
            {activeTab === 'coach' && (
              <div class="space-y-6 animate-fade-in">
                
                {/* 1. Resume Parsing & Generator Widget */}
                <div class="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
                  <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload class="w-4 h-4" />
                    Resume Upload & Auto Portfolio Builder
                  </h3>
                  
                  <div class="flex flex-col gap-3">
                    <p class="text-[11px] text-slate-450 leading-relaxed">
                      Upload your resume PDF (Max 5MB). Gemini will extract your skills, education, and experience, creating a compiled developer markdown portfolio layout instantly.
                    </p>

                    <div class="flex items-center gap-3">
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                        class="block w-full text-xs text-slate-450 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border file:border-slate-800 file:bg-slate-950 file:text-slate-350 file:text-xs file:font-semibold hover:file:bg-slate-900 cursor-pointer"
                      />
                      
                      <button
                        type="button"
                        onClick={handleResumeUpload}
                        disabled={resumeParsing || !resumeFile}
                        class="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                      >
                        {resumeParsing ? 'Extracting...' : 'Extract Data'}
                      </button>
                    </div>

                    {parsedProfile && (
                      <div class="bg-slate-950 p-3.5 border border-slate-900 rounded-xl space-y-3 animate-fade-in">
                        <div class="flex justify-between items-center border-b border-slate-900 pb-2">
                          <span class="text-xs font-bold text-slate-200">Extracted: {parsedProfile.name}</span>
                          <span class="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Success</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-center">
                          <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                            <span class="block text-xs font-bold text-indigo-400">{parsedProfile.skills?.length || 0}</span>
                            <span class="text-[8px] text-slate-500 font-bold uppercase">Skills</span>
                          </div>
                          <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                            <span class="block text-xs font-bold text-indigo-400">{parsedProfile.projects?.length || 0}</span>
                            <span class="text-[8px] text-slate-500 font-bold uppercase">Projects</span>
                          </div>
                          <div class="bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                            <span class="block text-xs font-bold text-indigo-400">{parsedProfile.experience?.length || 0}</span>
                            <span class="text-[8px] text-slate-500 font-bold uppercase">Jobs</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGeneratePortfolio}
                          class="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg hover:shadow-indigo-500/15"
                        >
                          ✨ Generate & Populate Portfolio Markdown
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Hybrid ATS suitability scanner */}
                <div class="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
                  <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target class="w-4 h-4" />
                    Target Job ATS suitability Analyzer
                  </h3>

                  <div class="space-y-3">
                    <p class="text-[11px] text-slate-450 leading-relaxed">
                      Compare your portfolio markdown text against a target Job Description. Our hybrid system matches keyword densities and queries Gemini to compile strengths and improvements.
                    </p>

                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description requirements here..."
                      rows="3"
                      class="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-3 text-xs focus:outline-none text-slate-200"
                    ></textarea>

                    <button
                      type="button"
                      onClick={handleATSCheck}
                      disabled={atsLoading || !jobDescription}
                      class="w-full py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      {atsLoading ? 'Evaluating Suitability...' : 'Run ATS Evaluation Check'}
                    </button>

                    {atsResult && (
                      <div class="bg-slate-950 p-4 border border-slate-900 rounded-xl space-y-4 animate-fade-in">
                        {/* ATS Score */}
                        <div class="flex items-center gap-4 border-b border-slate-900 pb-3">
                          <div class={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 font-extrabold ${atsResult.score >= 80 ? 'border-emerald-500 text-emerald-450' : atsResult.score >= 50 ? 'border-yellow-500 text-yellow-450' : 'border-red-500 text-red-450'}`}>
                            <span class="text-lg leading-none">{atsResult.score}</span>
                            <span class="text-[7px] uppercase font-bold tracking-tight mt-0.5">Score</span>
                          </div>
                          <div>
                            <h4 class="text-xs font-bold text-slate-200">ATS Combined Alignment</h4>
                            <p class="text-[10px] text-slate-500 mt-0.5">
                              Computed via 60% keyword match ({atsResult.keywordScore}%) & 40% LLM context match ({atsResult.geminiScore}%).
                            </p>
                          </div>
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div class="grid md:grid-cols-2 gap-4">
                          <div>
                            <span class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">✅ Strengths</span>
                            <ul class="space-y-1">
                              {atsResult.strengths?.map((str, i) => (
                                <li key={i} class="text-[10px] text-slate-400 leading-relaxed flex items-start gap-1">
                                  <span class="text-emerald-500 mt-0.5">•</span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span class="text-[9px] font-bold text-red-450 uppercase tracking-wider block mb-1.5">⚠️ Weaknesses</span>
                            <ul class="space-y-1">
                              {atsResult.weaknesses?.map((weak, i) => (
                                <li key={i} class="text-[10px] text-slate-400 leading-relaxed flex items-start gap-1">
                                  <span class="text-red-500 mt-0.5">•</span>
                                  <span>{weak}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Missing Keywords */}
                        {atsResult.missingKeywords?.length > 0 && (
                          <div class="pt-2">
                            <span class="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">💡 Recommended Missing Keywords</span>
                            <div class="flex flex-wrap gap-1.5">
                              {atsResult.missingKeywords.map((kw, i) => (
                                <span key={i} class="text-[9px] font-semibold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-indigo-300">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Career readiness roadmap builder */}
                <div class="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
                  <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp class="w-4 h-4" />
                    Career Role Fit Coach
                  </h3>

                  <div class="space-y-3">
                    <p class="text-[11px] text-slate-450 leading-relaxed">
                      Select a target role to audit your tech stack. Gemini evaluates your skill list and produces a custom learning roadmap.
                    </p>

                    <div class="flex gap-2">
                      <input 
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. AI Engineer, React Architect"
                        class="flex-grow bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-lg p-2.5 text-xs focus:outline-none text-slate-200"
                      />
                      
                      <button
                        type="button"
                        onClick={handleCareerCheck}
                        disabled={careerLoading || !targetRole}
                        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded-xl text-xs cursor-pointer whitespace-nowrap"
                      >
                        {careerLoading ? 'Analyzing...' : 'Grade Fit'}
                      </button>
                    </div>

                    {careerResult && (
                      <div class="bg-slate-950 p-4 border border-slate-900 rounded-xl space-y-3 animate-fade-in">
                        <div class="flex justify-between items-center border-b border-slate-900 pb-2">
                          <span class="text-xs font-bold text-slate-200">Readiness Score</span>
                          <span class="text-sm font-extrabold text-indigo-400">{careerResult.readiness}/100</span>
                        </div>

                        {careerResult.missingSkills?.length > 0 && (
                          <div>
                            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Missing Technical Skills</span>
                            <div class="flex flex-wrap gap-1">
                              {careerResult.missingSkills.map((sk, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    insertText(`\n- ${sk}`);
                                    alert(`Injected "${sk}" to skills in markdown editor!`);
                                  }}
                                  class="text-[9px] bg-slate-900 hover:bg-indigo-650/15 border border-slate-850 hover:border-indigo-550/30 px-2 py-0.5 rounded text-slate-400 hover:text-indigo-300 font-semibold transition-all cursor-pointer"
                                  title="Click to add to editor"
                                >
                                  + {sk}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {careerResult.roadmap?.length > 0 && (
                          <div class="pt-1">
                            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Action Plan Roadmap</span>
                            <ul class="space-y-2">
                              {careerResult.roadmap.map((step, i) => (
                                <li key={i} class="text-[10px] text-slate-450 leading-relaxed flex items-start gap-1.5">
                                  <span class="w-4.5 h-4.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5">{i+1}</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Quality Score Audit scorecard & trending */}
                <div class="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
                  <h3 class="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-900 pb-3">
                    <span>Layout & Content Audit Score</span>
                    <button 
                      onClick={handleScoreAudit}
                      disabled={scoreLoading || !portfolio}
                      class="px-3 py-1 bg-indigo-600/10 border border-indigo-500/25 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      {scoreLoading ? 'Auditing...' : 'Run Audit'}
                    </button>
                  </h3>

                  <div class="space-y-4">
                    {scoreResult && (
                      <div class="bg-slate-950 p-4 border border-slate-900 rounded-xl space-y-4 animate-fade-in">
                        <div class="flex justify-between items-center border-b border-slate-900 pb-2">
                          <span class="text-xs font-extrabold text-slate-200">Overall Rating</span>
                          <span class="text-base font-black text-emerald-400">{scoreResult.overall}/100</span>
                        </div>

                        {/* score categories */}
                        <div class="space-y-2">
                          {[
                            { label: 'Content Quality (30%)', val: scoreResult.content },
                            { label: 'Projects Showcase (30%)', val: scoreResult.projects },
                            { label: 'Skills Relevance (20%)', val: scoreResult.skills },
                            { label: 'SEO Config (10%)', val: scoreResult.seo },
                            { label: 'ATS Suitability (10%)', val: scoreResult.ats }
                          ].map((item, i) => (
                            <div key={i} class="space-y-1">
                              <div class="flex justify-between text-[10px] text-slate-400 font-semibold">
                                <span>{item.label}</span>
                                <span>{item.val}</span>
                              </div>
                              <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                                <div class="bg-indigo-500 h-full rounded-full" style={{ width: `${item.val}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Audit suggestions */}
                        {scoreResult.feedback?.length > 0 && (
                          <div class="pt-2 border-t border-slate-900">
                            <span class="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1.5">Feedback Checklist</span>
                            <ul class="space-y-1.5">
                              {scoreResult.feedback.map((item, i) => (
                                <li key={i} class="text-[10px] text-slate-400 leading-relaxed flex items-start gap-1">
                                  <span class="text-indigo-400 mt-0.5">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Historical trending */}
                    {auditHistory.length > 0 && (
                      <div class="space-y-2">
                        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Audit Score History Logs</span>
                        <div class="grid gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                          {auditHistory.map((audit, i) => (
                            <div 
                              key={audit._id}
                              class="bg-slate-900/50 p-2.5 border border-slate-850 rounded-xl flex items-center justify-between text-[10px] font-mono text-slate-400"
                            >
                              <span>Checkpoint #{i + 1} - {new Date(audit.createdAt).toLocaleDateString()}</span>
                              <strong class="text-emerald-450">{audit.overall}/100</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: THEMES */}
            {activeTab === 'themes' && (
              <div class="space-y-4">
                <h3 class="text-sm font-bold text-slate-400">Select Portfolio Visual Theme</h3>
                <div class="grid grid-cols-2 gap-4">
                  <button onClick={() => setTheme('Modern')} class={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all hover:scale-[1.01] cursor-pointer h-32 ${theme === 'Modern' ? 'bg-indigo-600/5 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'}`}>
                    <div>
                      <h4 class="font-bold text-sm text-slate-200">Modern Theme</h4>
                      <p class="text-[10px] text-slate-500 mt-1 leading-normal">Startup-style layout, indigo gradient blur highlights, elegant spacing.</p>
                    </div>
                    <span class="text-[9px] font-bold uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded-full">Light Mode</span>
                  </button>

                  <button onClick={() => setTheme('Professional')} class={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all hover:scale-[1.01] cursor-pointer h-32 ${theme === 'Professional' ? 'bg-indigo-600/5 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'}`}>
                    <div>
                      <h4 class="font-bold text-sm text-slate-200">Professional Theme</h4>
                      <p class="text-[10px] text-slate-500 mt-1 leading-normal">Classic corporate portfolio design. Navy accents, serif headings, clean alignment.</p>
                    </div>
                    <span class="text-[9px] font-bold uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded-full">Structured</span>
                  </button>

                  <button onClick={() => setTheme('DarkPro')} class={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all hover:scale-[1.01] cursor-pointer h-32 ${theme === 'DarkPro' ? 'bg-indigo-600/5 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'}`}>
                    <div>
                      <h4 class="font-bold text-sm text-slate-200">Dark Pro Theme</h4>
                      <p class="text-[10px] text-slate-500 mt-1 leading-normal">Developer-focused slate layout with emerald borders and monospaced pills.</p>
                    </div>
                    <span class="text-[9px] font-bold uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded-full">Dark Slate</span>
                  </button>

                  <button onClick={() => setTheme('Futuristic')} class={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all hover:scale-[1.01] cursor-pointer h-32 ${theme === 'Futuristic' ? 'bg-indigo-600/5 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'}`}>
                    <div>
                      <h4 class="font-bold text-sm text-slate-200">AI Futuristic</h4>
                      <p class="text-[10px] text-slate-500 mt-1 leading-normal">Glassmorphism panels, deep black starry environment, neon pink gradients.</p>
                    </div>
                    <span class="text-[9px] font-bold uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded-full">Glassmorphic</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: GITHUB IMPORT (AI summary updates) */}
            {activeTab === 'github' && (
              <div class="space-y-4">
                <div class="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h3 class="text-sm font-bold text-slate-350">Import GitHub Repositories</h3>
                  <button 
                    onClick={loadGitHubRepos}
                    class="p-1.5 hover:bg-slate-900 rounded border border-slate-850 text-slate-400 hover:text-indigo-400 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    disabled={reposLoading}
                  >
                    <RefreshCw class={`w-3.5 h-3.5 ${reposLoading ? 'animate-spin' : ''}`} />
                    Refresh Repos
                  </button>
                </div>

                {repoError && (
                  <div class="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-400 flex items-start gap-2">
                    <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{repoError}</span>
                  </div>
                )}

                {reposLoading ? (
                  <div class="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                    Retrieving repositories from user profile...
                  </div>
                ) : repos.length === 0 ? (
                  <div class="py-12 text-center text-xs text-slate-500">No public repositories found. Connect an active GitHub account.</div>
                ) : (
                  <div class="space-y-3">
                    <p class="text-[11px] text-slate-450 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                      Found <strong class="text-slate-200">{repos.length}</strong> public repositories for GitHub profile <strong>@{githubUsername}</strong>. Click "Import" for raw metadata, or "🧠 AI Summarize" to compile READMEs into professional project summaries.
                    </p>
                    <div class="grid gap-2.5 max-h-[350px] overflow-y-auto">
                      {repos.map(repo => (
                        <div 
                          key={repo.id}
                          class="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                        >
                          <div class="max-w-[65%]">
                            <h4 class="text-xs font-bold text-slate-200 tracking-wide truncate">{repo.name}</h4>
                            <p class="text-[10px] text-slate-500 truncate mt-0.5">{repo.description || 'No description provided.'}</p>
                            <div class="flex items-center gap-3 mt-1.5 text-[9px] text-slate-450 font-bold uppercase">
                              <span class="text-indigo-400">{repo.language}</span>
                              <span class="flex items-center gap-0.5">⭐ {repo.stargazers_count}</span>
                            </div>
                          </div>
                          
                          <div class="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => {
                                const projectMD = `\n### ${repo.name}\n${repo.description || 'Developed a public software utility.'}\n- **Tech**: ${repo.language || 'Software'}, GitHub API\n- [GitHub Repository](${repo.html_url})\n`;
                                insertText(projectMD);
                                alert(`Appended "${repo.name}" to projects markdown section!`);
                              }}
                              class="px-2 py-1.5 bg-slate-950 border border-slate-850 text-slate-350 hover:bg-slate-800 rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                            >
                              Import
                            </button>
                            <button
                              onClick={() => handleGitHubAISummarize(repo)}
                              disabled={repoAISummarizingId === repo.id}
                              class="px-2.5 py-1.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                            >
                              {repoAISummarizingId === repo.id ? 'Summarizing...' : '🧠 AI Summarize'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: VERSIONS */}
            {activeTab === 'versions' && (
              <div class="space-y-4">
                <h3 class="text-sm font-bold text-slate-400">Portfolio Version Benchmarks</h3>
                {versions.length === 0 ? (
                  <div class="py-12 text-center text-xs text-slate-500">No checkpoints recorded yet. Modifying and saving markdown updates creates revision nodes.</div>
                ) : (
                  <div class="space-y-2.5 max-h-[350px] overflow-y-auto">
                    {versions.map((ver, idx) => (
                      <div 
                        key={ver._id}
                        class="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <h4 class="text-xs font-bold text-slate-200">Revision #{versions.length - idx}</h4>
                          <span class="text-[10px] text-slate-500 font-mono mt-0.5 block">
                            Saved: {new Date(ver.createdAt).toLocaleString()}
                          </span>
                          <span class="text-[9px] text-slate-400 italic block mt-1">
                            Chars: {ver.markdown?.length || 0}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRollback(ver._id)}
                          class="px-3 py-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-350 hover:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw class="w-3 h-3" />
                          Rollback
                        </button>
                      </div>
                    )).reverse()}
                  </div>
                )}
              </div>
            )}

            {/* TAB: CONTACT MESSAGES */}
            {activeTab === 'messages' && (
              <div class="space-y-4 font-sans">
                <div class="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h3 class="text-sm font-bold text-slate-350">Client Query Messages</h3>
                  <button 
                    onClick={loadMessages}
                    class="p-1.5 hover:bg-slate-900 rounded border border-slate-850 text-slate-400 hover:text-indigo-400 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    disabled={messagesLoading}
                  >
                    <RefreshCw class={`w-3.5 h-3.5 ${messagesLoading ? 'animate-spin' : ''}`} />
                    Refresh Messages
                  </button>
                </div>

                {messagesLoading ? (
                  <div class="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                    Fetching inbox records...
                  </div>
                ) : messages.length === 0 ? (
                  <div class="py-12 text-center text-xs text-slate-500">Your portfolio message inbox is empty. Deployed contact form submissions will print here.</div>
                ) : (
                  <div class="space-y-3 max-h-[350px] overflow-y-auto">
                    {messages.map(msg => (
                      <div 
                        key={msg._id}
                        class="p-4 bg-slate-900/60 border border-slate-850 rounded-xl relative"
                      >
                        <div class="flex justify-between items-start">
                          <div>
                            <h4 class="text-xs font-bold text-slate-200 tracking-wide">{msg.name}</h4>
                            <a href={`mailto:${msg.email}`} class="text-[10px] text-indigo-400 hover:underline">{msg.email}</a>
                          </div>
                          <span class="text-[9px] text-slate-500 font-mono">{new Date(msg.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p class="text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-900 mt-2 leading-relaxed">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Editor Footer / Control Actions (Save & Deploy Panel) */}
          <div class="p-4 border-t border-slate-900 bg-slate-950 flex flex-col gap-3">
            <div class="bg-slate-900/40 border border-slate-900 p-3.5 rounded-2xl flex flex-col gap-2.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Globe class="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  GitHub Pages Deployment Target
                </span>
                {deployUrl && (
                  <a 
                    href={deployUrl} 
                    target="_blank" 
                    class="text-[10px] text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    Open Live
                    <ChevronRight class="w-3 h-3" />
                  </a>
                )}
              </div>

              <div class="flex gap-2">
                <div class="flex-grow relative">
                  <span class="absolute left-3.5 top-2.5 text-slate-600 text-xs font-mono select-none">repo/</span>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="portfolio-repo-name"
                    class="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2 pl-14 pr-4 text-xs font-mono focus:outline-none text-slate-200 transition-colors"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleDeploy}
                  disabled={deploying || !portfolio}
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {deploying ? (
                    <>
                      <RefreshCw class="w-3.5 h-3.5 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Globe class="w-3.5 h-3.5" />
                      One-Click Deploy
                    </>
                  )}
                </button>
              </div>

              {deployError && (
                <span class="text-[10px] text-red-400 font-semibold">{deployError}</span>
              )}
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                class="flex-grow py-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-750 text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <RefreshCw class="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckSquare class="w-3.5 h-3.5" />
                    Save Draft Checkpoint
                  </>
                )}
              </button>

              {saveSuccess && (
                <span class="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 class="w-4 h-4" />
                  Saved!
                </span>
              )}
            </div>

          </div>

        </div>

        {/* Right Side: Live preview Frame */}
        <div class="flex-grow lg:w-[55%] flex flex-col bg-slate-905">
          <div class="h-12 border-b border-slate-900 bg-slate-950 px-4 flex items-center justify-between select-none">
            <span class="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Eye class="w-4 h-4 text-indigo-400" />
              Live Theme Preview Render
            </span>

            <div class="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-850">
              <button 
                onClick={() => setViewportMode('desktop')}
                class={`p-1.5 rounded transition-all cursor-pointer ${viewportMode === 'desktop' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-205'}`}
                title="Desktop View"
              >
                <Monitor class="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewportMode('mobile')}
                class={`p-1.5 rounded transition-all cursor-pointer ${viewportMode === 'mobile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-205'}`}
                title="Mobile View"
              >
                <Smartphone class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="flex-grow p-6 flex items-center justify-center overflow-hidden relative">
            <div class={`h-full w-full max-w-full transition-all duration-300 ${viewportMode === 'mobile' ? 'max-w-[360px] max-h-[640px] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl bg-black' : ''}`}>
              <iframe
                title="Portfolio Sandbox Preview"
                srcDoc={getPreviewSource()}
                sandbox="allow-scripts"
                class="w-full h-full border-0 bg-slate-950 dark-scrollbar"
              ></iframe>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
