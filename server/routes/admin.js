const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const AdminAuditLog = require('../models/AdminAuditLog');
const UserActivity = require('../models/UserActivity');
const AIUsage = require('../models/AIUsage');
const GeminiCache = require('../models/GeminiCache');
const Analytic = require('../models/Analytic');
const AnalyticsEvent = require('../models/AnalyticsEvent');

// Apply auth and admin middleware to all routes in this router
router.use(auth, admin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard summary statistics (trends, totals, DAU/MAU)
 */
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Users stats
    const totalUsers = await User.countDocuments();
    const todayUsers = await User.countDocuments({ createdAt: { $gte: startOfToday } });
    const weekUsers = await User.countDocuments({ createdAt: { $gte: startOfWeek } });

    // Portfolios stats
    const totalPortfolios = await Portfolio.countDocuments({ isDeleted: false });
    const todayPortfolios = await Portfolio.countDocuments({ isDeleted: false, createdAt: { $gte: startOfToday } });

    // AI usage stats
    const aiRequests = await AIUsage.countDocuments();
    const cacheHits = await AIUsage.countDocuments({ cacheHit: true });
    const cacheHitRate = aiRequests > 0 ? parseFloat(((cacheHits / aiRequests) * 100).toFixed(1)) : 0;

    // DAU / MAU
    const dauUsers = await UserActivity.distinct('userId', { createdAt: { $gte: startOfToday } });
    const mauUsers = await UserActivity.distinct('userId', { createdAt: { $gte: startOf30Days } });

    res.json({
      users: {
        total: totalUsers,
        today: todayUsers,
        thisWeek: weekUsers
      },
      portfolios: {
        total: totalPortfolios,
        today: todayPortfolios
      },
      ai: {
        requests: aiRequests,
        cacheHitRate: cacheHitRate
      },
      activity: {
        dau: dauUsers.length,
        mau: mauUsers.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated and searchable list of users
 */
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      users,
      totalPages,
      currentPage: page,
      totalUsers
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user's role (with lockout and last admin protections)
 */
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Guard: Prevent demoting self
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Self-lockout protection: You cannot demote yourself.' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Guard: Demoting last admin
    if (targetUser.role === 'admin' && role !== 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ message: 'Self-lockout protection: Cannot demote the last active administrator.' });
      }
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    // Create Admin Audit Log automatically
    const auditLog = new AdminAuditLog({
      adminId: req.user._id,
      action: 'role-change',
      targetType: 'User',
      targetId: targetUser._id.toString(),
      details: { oldRole, newRole: role }
    });
    await auditLog.save();

    res.json({ message: 'User role updated successfully', user: targetUser });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user's status (suspend/activate with safeguards)
 */
router.put('/users/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const targetUserId = req.params.id;

    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive status is required' });
    }

    // Guard: Prevent disabling self
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Self-lockout protection: You cannot deactivate your own account.' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Guard: Deactivating the last admin
    if (targetUser.role === 'admin' && !isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ message: 'Self-lockout protection: Cannot deactivate the last active administrator.' });
      }
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    // Create Admin Audit Log automatically
    const auditLog = new AdminAuditLog({
      adminId: req.user._id,
      action: 'user-disable',
      targetType: 'User',
      targetId: targetUser._id.toString(),
      details: { isActive }
    });
    await auditLog.save();

    res.json({ message: `User status changed to ${isActive ? 'active' : 'suspended'}`, user: targetUser });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/portfolios
 * @desc    Get paginated portfolios directory
 */
router.get('/portfolios', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const filter = { isDeleted: false };
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const totalPortfolios = await Portfolio.countDocuments(filter);
    const totalPages = Math.ceil(totalPortfolios / limit);

    const portfolios = await Portfolio.find(filter)
      .populate('userId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      portfolios,
      totalPages,
      currentPage: page,
      totalPortfolios
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/admin/portfolios/:id
 * @desc    Soft-delete/moderate spam portfolios
 */
router.delete('/portfolios/:id', async (req, res, next) => {
  try {
    const portfolioId = req.params.id;

    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    portfolio.isDeleted = true;
    await portfolio.save();

    // Create Admin Audit Log automatically
    const auditLog = new AdminAuditLog({
      adminId: req.user._id,
      action: 'portfolio-delete',
      targetType: 'Portfolio',
      targetId: portfolio._id.toString(),
      details: { title: portfolio.title }
    });
    await auditLog.save();

    res.json({ message: 'Portfolio soft-deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/cache
 * @desc    Returns hit rates, item count, and cost ROI metrics
 */
router.get('/cache', async (req, res, next) => {
  try {
    const totalRequests = await AIUsage.countDocuments();
    const cacheHits = await AIUsage.countDocuments({ cacheHit: true });
    const cacheHitRate = totalRequests > 0 ? parseFloat(((cacheHits / totalRequests) * 100).toFixed(1)) : 0;

    // Calculate savings
    const hitStats = await AIUsage.aggregate([
      { $match: { cacheHit: true } },
      { $group: { _id: null, totalTokens: { $sum: '$tokensUsed' } } }
    ]);
    const hitTokens = hitStats.length > 0 ? hitStats[0].totalTokens : 0;
    
    // Standard rate is $0.15 per million input tokens. If hitTokens is 0 but we have cacheHits, fallback to a standard 2000 tokens/req
    const calculatedSavings = (hitTokens / 1000000) * 0.15;
    const estimatedSavings = cacheHits > 0 ? Math.max(calculatedSavings, cacheHits * 0.0003) : 0;

    const cacheItemsCount = await GeminiCache.countDocuments();

    res.json({
      totalRequests,
      cacheHits,
      cacheHitRate,
      estimatedSavings: parseFloat(estimatedSavings.toFixed(4)),
      cacheItemsCount
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/ai-usage
 * @desc    Returns token usages breakdown by features and timeline trend
 */
router.get('/ai-usage', async (req, res, next) => {
  try {
    // Total tokens, total cost estimate (assuming $0.15/1M input tokens + $0.60/1M output tokens average)
    const stats = await AIUsage.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$tokensUsed' },
          totalRequests: { $sum: 1 }
        }
      }
    ]);

    const totalTokens = stats.length > 0 ? stats[0].totalTokens : 0;
    const totalRequests = stats.length > 0 ? stats[0].totalRequests : 0;
    const averageTokensPerReq = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0;
    
    // Estimate cost: let's use a blended $0.20 per million tokens
    const estimatedCost = (totalTokens / 1000000) * 0.20;

    // Token breakout by feature
    const featureBreakdown = await AIUsage.aggregate([
      {
        $group: {
          _id: '$feature',
          requests: { $sum: 1 },
          tokens: { $sum: '$tokensUsed' }
        }
      },
      { $sort: { tokens: -1 } }
    ]);

    // Timeline trend (last 14 days)
    const timelineLimit = new Date();
    timelineLimit.setDate(timelineLimit.getDate() - 14);

    const usageTrend = await AIUsage.aggregate([
      { $match: { createdAt: { $gte: timelineLimit } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          tokens: { $sum: '$tokensUsed' },
          requests: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalTokens,
      totalRequests,
      averageTokensPerReq,
      estimatedCost: parseFloat(estimatedCost.toFixed(4)),
      featureBreakdown,
      usageTrend
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/analytics
 * @desc    Visitor aggregate breakouts and popular leaderboards
 */
router.get('/analytics', async (req, res, next) => {
  try {
    // Aggregated visitor actions
    const lifetimeStats = await Analytic.aggregate([
      {
        $group: {
          _id: null,
          views: { $sum: '$views' },
          clicks: { $sum: '$githubClicks' },
          downloads: { $sum: '$resumeDownloads' },
          contactSubmissions: { $sum: '$contactSubmissions' }
        }
      }
    ]);

    const stats = lifetimeStats[0] || { views: 0, clicks: 0, downloads: 0, contactSubmissions: 0 };

    // Popular portfolio leaderboards
    const leaderboard = await Analytic.find()
      .populate({
        path: 'portfolioId',
        match: { isDeleted: false },
        populate: { path: 'userId', select: 'name email avatarUrl' }
      })
      .sort({ views: -1 })
      .limit(10);

    const activeLeaderboard = leaderboard
      .filter(item => item.portfolioId !== null)
      .map(item => ({
        portfolioId: item.portfolioId._id,
        title: item.portfolioId.title,
        owner: item.portfolioId.userId ? item.portfolioId.userId.name : 'Unknown Owner',
        avatarUrl: item.portfolioId.userId ? item.portfolioId.userId.avatarUrl : '',
        views: item.views,
        score: item.portfolioId.score ? item.portfolioId.score.overall : 0
      }));

    // Device / browser breakouts (from AnalyticsEvent)
    const deviceBreakdown = await AnalyticsEvent.aggregate([
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const countryBreakdown = await AnalyticsEvent.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      summary: stats,
      leaderboard: activeLeaderboard,
      deviceBreakdown,
      countryBreakdown
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/system
 * @desc    Diagnostics probe verifying db ping and third-party latencies
 */
router.get('/system', async (req, res, next) => {
  try {
    // 1. MongoDB Latency
    const mongoStart = Date.now();
    await mongoose.connection.db.admin().ping();
    const mongoLatency = Date.now() - mongoStart;

    // 2. GitHub API Latency (with abort controller timeout)
    let githubLatency = -1;
    const ghStart = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch('https://api.github.com', { signal: controller.signal });
      clearTimeout(timeoutId);
      githubLatency = Date.now() - ghStart;
    } catch (err) {
      console.warn('GitHub latency test failed/timed out:', err.message);
      githubLatency = -1; // offline or rate-limited
    }

    // 3. Gemini avg latency
    const geminiStats = await AIUsage.aggregate([
      { $match: { cacheHit: false, responseTime: { $gt: 0 } } },
      { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
    ]);
    const geminiAvgLatency = geminiStats.length > 0 ? Math.round(geminiStats[0].avgTime) : 0;

    res.json({
      mongoLatency,
      githubLatency,
      geminiAvgLatency,
      uptime: Math.round(process.uptime()),
      memoryUsage: process.memoryUsage()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Paginated audit log viewer
 */
router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const totalLogs = await AdminAuditLog.countDocuments();
    const totalPages = Math.ceil(totalLogs / limit);

    const auditLogs = await AdminAuditLog.find()
      .populate('adminId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      auditLogs,
      totalPages,
      currentPage: page,
      totalLogs
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
