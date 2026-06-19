const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['view', 'github_click', 'resume_download', 'contact_submit'],
    required: true,
    index: true
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  device: {
    type: String,
    enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
    default: 'Desktop'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  referrer: {
    type: String,
    default: 'Direct'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
