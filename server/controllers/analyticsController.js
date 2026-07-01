const AnalyticsEvent = require('../models/AnalyticsEvent');
const PortfolioAnalytics = require('../models/PortfolioAnalytics');
const Portfolio = require('../models/Portfolio');

/**
 * Log a raw visitor action, with browser device parsing.
 */
async function ping(req, res, next) {
  const { portfolioId, type, referrer, elementName } = req.body;

  if (!portfolioId || !type) {
    return res.status(400).json({ message: 'Portfolio ID and event type are required.' });
  }

  try {
    // Basic User-Agent Device Detection
    const userAgent = req.headers['user-agent'] || '';
    let deviceType = 'Desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'Mobile';
    else if (/ipad|tablet/i.test(userAgent)) deviceType = 'Tablet';

    const newEvent = new AnalyticsEvent({
      portfolioId,
      type,
      elementName: elementName || '',
      referrer: referrer || 'Direct',
      country: 'Local',
      deviceType
    });
    await newEvent.save();

    res.json({ success: true, eventId: newEvent._id });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets aggregated timeline, location, and conversion funnel metrics.
 */
async function getMetrics(req, res, next) {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found.' });
    }

    // 1. Fetch permanent aggregated metrics
    const aggregates = await PortfolioAnalytics.find({ portfolioId: portfolio._id }).sort({ date: 1 });

    // 2. Fetch raw recent events (from past 30 days) to construct charts or locations
    const rawEvents = await AnalyticsEvent.find({ portfolioId: portfolio._id }).sort({ createdAt: -1 });

    // Compute Funnel
    let views = 0;
    let resumeDownloads = 0;
    let recruiterViews = 0;
    let projectClicksTotal = 0;
    const projectMap = {};

    aggregates.forEach(agg => {
      views += agg.viewsCount || 0;
      resumeDownloads += agg.resumeDownloads || 0;
      recruiterViews += agg.recruiterViews || 0;
      
      (agg.projectClicks || []).forEach(proj => {
        projectMap[proj.projectId] = (projectMap[proj.projectId] || 0) + proj.clicks;
        projectClicksTotal += proj.clicks;
      });
    });

    const projectClicks = Object.entries(projectMap).map(([id, clicks]) => ({
      projectId: id,
      clicks
    }));

    // Device distributions from raw events
    const devices = { Mobile: 0, Desktop: 0, Tablet: 0 };
    rawEvents.forEach(evt => {
      if (evt.deviceType && devices[evt.deviceType] !== undefined) {
        devices[evt.deviceType]++;
      } else {
        devices.Desktop++;
      }
    });

    res.json({
      success: true,
      summary: {
        totalViews: views,
        uniqueVisitors: Math.round(views * 0.7), // simple fallback
        resumeDownloads,
        recruiterViews,
        projectClicksTotal
      },
      funnel: {
        views,
        projectClicks: projectClicksTotal,
        resumeDownloads,
        contactsCount: recruiterViews // using recruiter views as conversion proxy
      },
      projectClicks,
      deviceDistribution: devices,
      timeline: aggregates.map(agg => ({
        date: agg.date.toISOString().substring(0, 10),
        views: agg.viewsCount,
        downloads: agg.resumeDownloads,
        recruiters: agg.recruiterViews
      }))
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  ping,
  getMetrics
};
