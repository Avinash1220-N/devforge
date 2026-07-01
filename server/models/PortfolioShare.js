const mongoose = require('mongoose');

const PortfolioShareSchema = new mongoose.Schema({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    index: true
  },
  shareToken: {
    type: String,
    required: true,
    unique: true
  },
  label: {
    type: String,
    default: 'Recruiter Link'
  },
  passwordHash: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  isOneTime: {
    type: Boolean,
    default: false
  },
  hasBeenUsed: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PortfolioShare', PortfolioShareSchema);
