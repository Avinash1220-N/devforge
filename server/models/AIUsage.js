const mongoose = require('mongoose');

const AIUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  feature: {
    type: String,
    required: true,
    index: true // index for feature based analytics
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number,
    default: 0 // Response latency in ms
  },
  model: {
    type: String,
    default: 'gemini-2.5-flash'
  },
  cacheHit: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for user history queries sorted by time
AIUsageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AIUsage', AIUsageSchema);
