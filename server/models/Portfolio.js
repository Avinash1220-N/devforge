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

// Personal Information Schema
const PersonalInfoSchema = new mongoose.Schema({
  photoUrl: String,
  fullName: { type: String, default: '' },
  title: { type: String, default: '' },
  headline: { type: String, default: '' },
  summary: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  availability: {
    type: String,
    enum: ['Open to Work', 'Freelance', 'Hiring', 'Unavailable'],
    default: 'Open to Work'
  },
  resumeUrl: String
});

// Social Links Schema
const SocialsSchema = new mongoose.Schema({
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  portfolioWebsite: { type: String, default: '' },
  leetCode: { type: String, default: '' },
  codeChef: { type: String, default: '' },
  codeforces: { type: String, default: '' },
  hackerRank: { type: String, default: '' },
  kaggle: { type: String, default: '' },
  medium: { type: String, default: '' },
  youtube: { type: String, default: '' }
});

// Skill Tag Schema
const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Languages', 'Frameworks', 'Databases', 'Cloud', 'DevOps', 'AI / ML', 'Tools', 'Soft Skills']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Expert', 'Advanced'],
    default: 'Intermediate'
  }
});

// Education Entry Schema
const EducationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  specialization: { type: String, default: '' },
  location: { type: String, default: '' },
  cgpa: { type: String, default: '' },
  percentage: { type: String, default: '' },
  coursework: [{ type: String }],
  websiteUrl: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  description: { type: String, default: '' },
  tags: [{ type: String }]
});

// Experience Metrics Schema
const ExperienceMetricSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
});

// Experience Entry Schema
const ExperienceSchema = new mongoose.Schema({
  role: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: '' },
  websiteUrl: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  employmentType: {
    type: String,
    enum: ['Internship', 'Part-Time', 'Full-Time', 'Volunteer', 'Freelance'],
    default: 'Full-Time'
  },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  description: { type: String, default: '' },
  skillsUsed: [{ type: String }],
  metrics: [ExperienceMetricSchema]
});

// Project Metrics Schema
const ProjectMetricSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
});

// Project Entry Schema
const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  techStack: [{ type: String }],
  githubUrl: { type: String, default: '' },
  liveUrl: { type: String, default: '' },
  videoDemoUrl: { type: String, default: '' },
  screenshots: [{ type: String }],
  architectureDiagramUrl: { type: String, default: '' },
  teamSize: { type: Number, default: 1 },
  duration: { type: String, default: '' },
  role: { type: String, default: '' },
  metrics: [ProjectMetricSchema],
  recruiterSummary: { type: String, default: '' },
  resumeBullets: [{ type: String }]
});

// Activity/Leadership Entry Schema
const ActivitySchema = new mongoose.Schema({
  organization: { type: String, required: true },
  position: { type: String, required: true },
  duration: { type: String, default: '' },
  description: { type: String, default: '' },
  achievements: [{ type: String }],
  websiteUrl: { type: String, default: '' },
  logoUrl: { type: String, default: '' }
});

// Achievement Entry Schema
const AchievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  awardDate: { type: String, default: '' },
  awardImageUrl: { type: String, default: '' },
  verificationLink: { type: String, default: '' }
});

// Certification Schema
const CertificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  issueDate: { type: String, default: '' },
  expiryDate: { type: String, default: '' },
  credentialId: { type: String, default: '' },
  credentialUrl: { type: String, default: '' },
  verificationLink: { type: String, default: '' }
});

// Publication Schema
const PublicationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authors: [{ type: String }],
  conferenceOrJournal: { type: String, default: '' },
  doi: { type: String, default: '' },
  year: { type: Number },
  paperUrl: { type: String, default: '' }
});

// Custom Markdown Sections Schema
const CustomSectionSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  contentMarkdown: { type: String, required: true }
});

// Migration History Schema
const MigrationHistorySchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  migratedAt: { type: Date, default: Date.now }
});

// Master Portfolio Schema
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
    structuredData: { type: String }
  },
  seoSettings: {
    metaTitle: String,
    metaDescription: String,
    openGraph: {
      title: String,
      description: String,
      imageUrl: String
    },
    twitterCard: {
      title: String,
      description: String,
      imageUrl: String
    },
    structuredDataJsonLd: String, // Schema.org markup
    canonicalUrl: String
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
  
  // Phase 1-4 legacy parsed data cache (retained for backward compatibility)
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

  // V2.1 Structured Form master document
  structuredData: {
    personalInfo: { type: PersonalInfoSchema, default: () => ({}) },
    socials: { type: SocialsSchema, default: () => ({}) },
    skills: [SkillSchema],
    education: [EducationSchema],
    experience: [ExperienceSchema],
    projects: [ProjectSchema],
    activities: [ActivitySchema],
    achievements: [AchievementSchema],
    certifications: [CertificationSchema],
    publications: [PublicationSchema],
    customSections: [CustomSectionSchema]
  },

  // V2.1 CMS Layout and Order
  enabledSections: {
    personalInfo: { type: Boolean, default: true },
    about: { type: Boolean, default: true },
    skills: { type: Boolean, default: true },
    education: { type: Boolean, default: true },
    experience: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    activities: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true },
    certifications: { type: Boolean, default: true },
    publications: { type: Boolean, default: true },
    customSections: { type: Boolean, default: true }
  },
  sectionOrder: {
    type: [String],
    default: [
      'personalInfo',
      'about',
      'skills',
      'education',
      'experience',
      'projects',
      'activities',
      'achievements',
      'certifications',
      'publications',
      'customSections'
    ]
  },

  // V2.1 Custom Appearance Override Engine
  themeSettings: {
    primaryColor: String,
    secondaryColor: String,
    backgroundColor: String,
    fontFamily: String,
    isDarkMode: { type: Boolean, default: true },
    customCssVariables: {
      type: Map,
      of: String,
      default: () => new Map()
    }
  },

  structuredDataVersion: {
    type: String,
    default: '2.1'
  },
  draftStatus: {
    type: String,
    enum: ['draft', 'review', 'published'],
    default: 'draft'
  },
  migrationHistory: [MigrationHistorySchema],
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
PortfolioSchema.index({ userId: 1, draftStatus: 1 });

// Middleware to update the updatedAt field on save
PortfolioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
