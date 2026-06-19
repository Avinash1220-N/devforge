const mongoose = require('mongoose');

const AnalyticSchema = new mongoose.Schema({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    unique: true,
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  githubClicks: {
    type: Number,
    default: 0
  },
  resumeDownloads: {
    type: Number,
    default: 0
  },
  contactSubmissions: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Analytic', AnalyticSchema);
