const mongoose = require('mongoose');

const GeminiCacheSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  response: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7 // Automatically deletes cache entries after 7 days (604800 seconds)
  }
});

module.exports = mongoose.model('GeminiCache', GeminiCacheSchema);
