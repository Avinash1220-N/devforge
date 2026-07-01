const mongoose = require('mongoose');

const PortfolioVersionSchema = new mongoose.Schema({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  markdown: {
    type: String,
    required: true
  },
  structuredData: {
    type: Object,
    required: true
  },
  theme: {
    type: String,
    required: true
  },
  themeSettings: {
    type: Object
  },
  changeSummary: {
    type: String,
    default: ''
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isRollbackPoint: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for query listing in descending version order
PortfolioVersionSchema.index({ portfolioId: 1, versionNumber: -1 });

module.exports = mongoose.model('PortfolioVersion', PortfolioVersionSchema);
