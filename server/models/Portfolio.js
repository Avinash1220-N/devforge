const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  markdown: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PortfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  markdown: {
    type: String,
    required: true
  },
  theme: {
    type: String,
    enum: ['Modern', 'Professional', 'DarkPro', 'Futuristic'],
    default: 'DarkPro'
  },
  title: {
    type: String,
    default: 'My Developer Portfolio'
  },
  seo: {
    title: { type: String },
    description: { type: String },
    keywords: [{ type: String }],
    structuredData: { type: String } // JSON-LD string
  },
  deploymentUrl: {
    type: String
  },
  githubRepoName: {
    type: String
  },
  score: {
    overall: { type: Number, default: 0 },
    design: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
    seoScore: { type: Number, default: 0 },
    projectsScore: { type: Number, default: 0 },
    feedback: [{ type: String }]
  },
  parsedData: {
    name: { type: String },
    email: { type: String },
    skills: [{ type: String }],
    education: [{
      school: String,
      degree: String,
      year: String
    }],
    projects: [{
      title: String,
      description: String,
      techStack: [String]
    }],
    experience: [{
      company: String,
      role: String,
      duration: String,
      bullets: [String]
    }]
  },
  versions: [VersionSchema],
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PortfolioSchema.index({ userId: 1, isDeleted: 1 });

// Middleware to update the updatedAt field on save
PortfolioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);

