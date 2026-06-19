const mongoose = require('mongoose');

const PortfolioAuditSchema = new mongoose.Schema({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    index: true
  },
  overall: {
    type: Number,
    required: true
  },
  ats: {
    type: Number,
    required: true
  },
  content: {
    type: Number,
    required: true
  },
  seo: {
    type: Number,
    required: true
  },
  projects: {
    type: Number,
    required: true
  },
  feedback: [{
    type: String
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to quickly fetch latest audit history records
PortfolioAuditSchema.index({ portfolioId: 1, createdAt: -1 });

module.exports = mongoose.model('PortfolioAudit', PortfolioAuditSchema);
