const express = require('express');
const router = express.Router();
const UAParser = require('ua-parser-js');
const axios = require('axios');
const Analytic = require('../models/Analytic');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const auth = require('../middleware/auth');

/**
 * Helper to fetch visitor country from IP
 */
const getCountryFromIp = async (ip) => {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    // Return a random country for local dev simulation
    const mockCountries = ['India', 'United States', 'United Kingdom', 'Germany', 'Canada', 'Singapore', 'Australia'];
    return mockCountries[Math.floor(Math.random() * mockCountries.length)];
  }
  
  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}`);
    if (res.data && res.data.status === 'success') {
      return res.data.country || 'Unknown';
    }
  } catch (err) {
    console.warn('IP geolocation failed:', err.message);
  }
  return 'Unknown';
};

/**
 * @route   POST /api/analytics/ping
 * @desc    Log a visitor analytics event (view, click, download, contact)
 */
router.post('/ping', async (req, res) => {
  const { portfolioId, type, referrer } = req.body;

  if (!portfolioId || !type) {
    return res.status(400).json({ message: 'Missing portfolioId or event type' });
  }

  try {
    // 1. Get client IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const country = await getCountryFromIp(ip);

    // 2. Parse User-Agent
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const uaResults = parser.getResult();

    // Map device type
    let device = 'Desktop';
    if (uaResults.device.type === 'mobile') device = 'Mobile';
    else if (uaResults.device.type === 'tablet') device = 'Tablet';
    else if (uaResults.device.type) device = uaResults.device.type;

    const browser = uaResults.browser.name || 'Unknown';

    // 3. Create detailed analytics event
    const newEvent = new AnalyticsEvent({
      portfolioId,
      type,
      country,
      device,
      browser,
      referrer: referrer || 'Direct'
    });
    await newEvent.save();

    // 4. Atomically increment summary aggregates in Analytic document
    const incrementFields = {};
    if (type === 'view') incrementFields.views = 1;
    else if (type === 'github_click') incrementFields.githubClicks = 1;
    else if (type === 'resume_download') incrementFields.resumeDownloads = 1;
    else if (type === 'contact_submit') incrementFields.contactSubmissions = 1;

    await Analytic.findOneAndUpdate(
      { portfolioId },
      { $inc: incrementFields },
      { upsert: true, new: true }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Failed to log analytic event:', error);
    res.status(500).json({ message: 'Failed to record metric' });
  }
});

/**
 * @route   GET /api/analytics/:portfolioId
 * @desc    Fetch aggregated summary and recent events for a portfolio
 */
router.get('/:portfolioId', auth, async (req, res) => {
  const { portfolioId } = req.params;

  try {
    // 1. Fetch aggregates
    let summary = await Analytic.findOne({ portfolioId });
    if (!summary) {
      summary = new Analytic({ portfolioId });
      await summary.save();
    }

    // 2. Fetch browser distribution
    const browserStats = await AnalyticsEvent.aggregate([
      { $match: { portfolioId: new mongoose.Types.ObjectId(portfolioId), type: 'view' } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 3. Fetch device distribution
    const deviceStats = await AnalyticsEvent.aggregate([
      { $match: { portfolioId: new mongoose.Types.ObjectId(portfolioId), type: 'view' } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 4. Fetch country distribution
    const countryStats = await AnalyticsEvent.aggregate([
      { $match: { portfolioId: new mongoose.Types.ObjectId(portfolioId), type: 'view' } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 5. Fetch referrer stats
    const referrerStats = await AnalyticsEvent.aggregate([
      { $match: { portfolioId: new mongoose.Types.ObjectId(portfolioId), type: 'view' } },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 6. Fetch recent visits
    const recentVisits = await AnalyticsEvent.find({ portfolioId, type: 'view' })
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      summary,
      breakdowns: {
        browser: browserStats,
        device: deviceStats,
        country: countryStats,
        referrer: referrerStats
      },
      recentVisits
    });

  } catch (error) {
    console.error('Failed to retrieve analytics:', error);
    res.status(500).json({ message: 'Server error retrieving analytics' });
  }
});

// Import mongoose so that aggregation queries can cast the portfolioId string to ObjectId
const mongoose = require('mongoose');

module.exports = router;
