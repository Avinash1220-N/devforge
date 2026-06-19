const mongoose = require('mongoose');

const AdminAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true
  }, // e.g. 'role-change', 'user-disable', 'portfolio-delete'
  targetType: {
    type: String,
    required: true
  }, // e.g. 'User', 'Portfolio'
  targetId: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

AdminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminAuditLog', AdminAuditLogSchema);
