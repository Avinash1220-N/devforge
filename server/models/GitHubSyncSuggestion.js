const mongoose = require('mongoose');

const GitHubSyncSuggestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  repositoryName: {
    type: String,
    required: true
  },
  suggestionType: {
    type: String,
    enum: ['new_repo', 'readme_update']
  },
  summary: {
    type: String
  },
  projectData: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    technologies: [{
      type: String
    }],
    githubUrl: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedProjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio'
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GitHubSyncSuggestion', GitHubSyncSuggestionSchema);
