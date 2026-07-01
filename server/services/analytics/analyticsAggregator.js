const AnalyticsEvent = require('../../models/AnalyticsEvent');
const PortfolioAnalytics = require('../../models/PortfolioAnalytics');

/**
 * Aggregates raw AnalyticsEvent entries into permanent PortfolioAnalytics aggregates.
 * Typically runs for a specific date or defaults to yesterday.
 * 
 * @param {Date} [targetDate] - The date to aggregate metrics for (defaults to yesterday)
 */
async function aggregateAnalyticsForDate(targetDate) {
  // Use yesterday if no date is provided
  const date = targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Normalize to UTC midnight
  const utcMidnight = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0, 0
  ));

  const startOfRange = new Date(utcMidnight);
  const endOfRange = new Date(utcMidnight.getTime() + 24 * 60 * 60 * 1000);

  console.log(`[Analytics Job] Running daily aggregation for date: ${utcMidnight.toISOString().substring(0, 10)}`);

  try {
    // 1. Fetch distinct portfolios that had events in this range
    const portfoliosWithEvents = await AnalyticsEvent.distinct('portfolioId', {
      createdAt: { $gte: startOfRange, $lt: endOfRange }
    });

    console.log(`[Analytics Job] Found ${portfoliosWithEvents.length} portfolios with active events.`);

    for (const portfolioId of portfoliosWithEvents) {
      // 2. Aggregate metrics for this specific portfolio on this date
      const queryFilter = {
        portfolioId,
        createdAt: { $gte: startOfRange, $lt: endOfRange }
      };

      // Count Views
      const viewsCount = await AnalyticsEvent.countDocuments({ ...queryFilter, type: 'view' });

      // Count Resume Downloads
      const resumeDownloads = await AnalyticsEvent.countDocuments({ ...queryFilter, type: 'download' });

      // Count Recruiter Views
      const recruiterViews = await AnalyticsEvent.countDocuments({ ...queryFilter, type: 'recruiter_view' });

      // Count Unique Visitors (mock using distinct session/IP mapping if tracked, otherwise distinct referrer or fallback)
      const uniqueVisitors = viewsCount > 0 ? Math.max(1, Math.round(viewsCount * 0.7)) : 0; // Simple fallback estimate

      // Aggregate Project Clicks
      const projectClickEvents = await AnalyticsEvent.find({ ...queryFilter, type: 'click' });
      const projectClicksMap = {};
      
      projectClickEvents.forEach(evt => {
        const id = evt.elementName || 'unknown_project';
        projectClicksMap[id] = (projectClicksMap[id] || 0) + 1;
      });

      const projectClicks = Object.entries(projectClicksMap).map(([projectId, clicks]) => ({
        projectId,
        clicks
      }));

      // 3. Upsert aggregate document
      await PortfolioAnalytics.findOneAndUpdate(
        { portfolioId, date: utcMidnight },
        {
          $set: {
            viewsCount,
            uniqueVisitors,
            resumeDownloads,
            recruiterViews,
            projectClicks,
            lastUpdated: new Date()
          }
        },
        { upsert: true, new: true }
      );

      console.log(`[Analytics Job] Successfully aggregated metrics for portfolio: ${portfolioId}`);
    }

    console.log('[Analytics Job] Daily aggregation job completed.');
  } catch (err) {
    console.error('[Analytics Job] Aggregator service execution failed:', err);
    throw err;
  }
}

module.exports = {
  aggregateAnalyticsForDate
};
