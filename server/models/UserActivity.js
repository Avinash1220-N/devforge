const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true
  }, // e.g. 'login', 'portfolio_created', 'portfolio_deployed', 'resume_uploaded', 'ats_check'
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserActivitySchema.index({ userId: 1, createdAt: -1 });
UserActivitySchema.index({ action: 1, createdAt: -1 });

// Explicit TTL index
UserActivitySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 31536000 }
);

module.exports = mongoose.model('UserActivity', UserActivitySchema);
