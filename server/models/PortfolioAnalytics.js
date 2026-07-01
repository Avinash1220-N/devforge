const mongoose = require('mongoose');

const PortfolioAnalyticsSchema = new mongoose.Schema({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  date: {
    type: Date,
    required: true
  }, // Midnight UTC Date
  viewsCount: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  resumeDownloads: {
    type: Number,
    default: 0
  },
  recruiterViews: {
    type: Number,
    default: 0
  },
  projectClicks: [{
    projectId: {
      type: String,
      required: true
    },
    clicks: {
      type: Number,
      default: 0
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Unique compound index: One record per portfolio per day
PortfolioAnalyticsSchema.index({ portfolioId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PortfolioAnalytics', PortfolioAnalyticsSchema);
