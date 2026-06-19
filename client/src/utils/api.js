import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Crucial for HttpOnly session cookie parsing
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authAPI = {
  me: () => api.get('/auth/me'),
  mockLogin: (username, role) => api.post('/auth/mock-login', { username, role }),
  logout: () => api.post('/auth/logout')
};

export const githubAPI = {
  fetchRepos: () => api.get('/github/repos'),
  fetchReadme: (owner, repo) => api.get(`/github/repos/${owner}/${repo}/readme`)
};

export const portfolioAPI = {
  getMine: () => api.get('/portfolios/user/me'),
  getById: (id) => api.get(`/portfolios/${id}`),
  save: (data) => api.post('/portfolios', data),
  rollback: (versionId) => api.post('/portfolios/rollback', { versionId }),
  getMessages: () => api.get('/portfolios/user/messages')
};

export const deployAPI = {
  deployGitHubPages: (portfolioId, repoName, htmlContent, themeName) => 
    api.post('/deploy/gh-pages', { portfolioId, repoName, htmlContent, themeName })
};

export const aiAPI = {
  parseResume: (formData) => api.post('/ai/parse-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  generatePortfolio: () => api.post('/ai/generate-portfolio'),
  projectSummary: (repoData) => api.post('/ai/project-summary', repoData),
  careerFit: (skills, targetRole) => api.post('/ai/career-fit', { skills, targetRole }),
  rewrite: (text, role) => api.post('/ai/rewrite', { text, role }),
  atsScore: (portfolioText, jobDescription) => api.post('/ai/ats-score', { portfolioText, jobDescription }),
  portfolioScore: (portfolioId, portfolioText) => api.post('/ai/portfolio-score', { portfolioId, portfolioText }),
  getAudits: (portfolioId) => api.get(`/ai/portfolio-audits/${portfolioId}`)
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (page, limit, search) => api.get('/admin/users', { params: { page, limit, search } }),
  changeUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  changeUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  getPortfolios: (page, limit, search) => api.get('/admin/portfolios', { params: { page, limit, search } }),
  deletePortfolio: (id) => api.delete(`/admin/portfolios/${id}`),
  getCacheStats: () => api.get('/admin/cache'),
  getAIUsage: () => api.get('/admin/ai-usage'),
  getAnalytics: () => api.get('/admin/analytics'),
  getSystemHealth: () => api.get('/admin/system'),
  getAuditLogs: (page, limit) => api.get('/admin/audit-logs', { params: { page, limit } })
};

export default api;
export { API_BASE };
