const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  githubId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  githubAccessToken: {
    type: String,
    select: false // Never returned by default in queries to prevent accidental token exposure
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  aiBudget: {
    limit: { type: Number, default: 50 },
    spent: { type: Number, default: 0 },
    month: { type: String, default: "" },
    lastResetAt: { type: Date }
  }
});

UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ "aiBudget.month": 1 });

module.exports = mongoose.model('User', UserSchema);

