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
    required: true,
    enum: ['view', 'click', 'download', 'recruiter_view']
  },
  elementName: {
    type: String
  },
  referrer: {
    type: String
  },
  country: {
    type: String
  },
  deviceType: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 days TTL
  }
});

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
