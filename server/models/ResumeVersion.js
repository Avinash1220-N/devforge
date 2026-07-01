const mongoose = require('mongoose');

const ResumeVersionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storageProvider: {
    type: String,
    enum: ['local', 'cloud'],
    default: 'local'
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  checksum: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  isLatest: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parsedData: {
    type: Object
  },
  atsAnalysis: {
    type: Object
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for query optimization
ResumeVersionSchema.index({ userId: 1, isLatest: 1 });
ResumeVersionSchema.index({ userId: 1, checksum: 1 }, { unique: true });

module.exports = mongoose.model('ResumeVersion', ResumeVersionSchema);
