const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  actionUrl: {
    type: String
  },
  type: {
    type: String,
    enum: ['resume_parsed', 'ats_updated', 'portfolio_published', 'theme_installed', 'recruiter_view', 'github_sync']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Purge notifications automatically after 180 days (15,552,000 seconds)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

module.exports = mongoose.model('Notification', NotificationSchema);
