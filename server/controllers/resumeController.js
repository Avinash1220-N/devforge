const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ResumeVersion = require('../models/ResumeVersion');
const Portfolio = require('../models/Portfolio');
const { parseResumePdf } = require('../services/ai/resumeParser');
const { analyzeAtsScore } = require('../services/ai/atsService');

/**
 * Handle resume PDF uploads, checksum validation, and version incrementing.
 */
async function uploadResume(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a PDF resume file.' });
  }

  try {
    const buffer = req.file.buffer;
    
    // 1. Calculate file checksum to prevent duplicate uploads per user
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const duplicate = await ResumeVersion.findOne({ userId: req.user._id, checksum });
    
    if (duplicate) {
      return res.status(400).json({ message: 'This resume file has already been uploaded.' });
    }

    // 2. Determine incremental version number
    const count = await ResumeVersion.countDocuments({ userId: req.user._id });
    const version = count + 1;

    // 3. Save file locally to server/uploads/ directory
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePrefix = `${req.user._id}_v${version}_`;
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const localFileName = `${filePrefix}${safeName}`;
    const filePath = path.join(uploadsDir, localFileName);
    
    fs.writeFileSync(filePath, buffer);
    const fileUrl = `/uploads/${localFileName}`;

    // 4. Mark all older user resumes as not latest
    await ResumeVersion.updateMany({ userId: req.user._id }, { $set: { isLatest: false } });

    // 5. Parse resume contents using the AI Resume Parser
    console.log(`[Resume Upload] Parsing upload version ${version}...`);
    let parsedData = {};
    try {
      parsedData = await parseResumePdf(buffer, req.user._id);
    } catch (parseErr) {
      console.warn('AI Parsing failed, saving blank structured cache:', parseErr.message);
    }

    // 6. Save ResumeVersion record
    const newVersion = new ResumeVersion({
      userId: req.user._id,
      storageProvider: 'local',
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      checksum,
      version,
      isLatest: true,
      isActive: true,
      parsedData
    });

    await newVersion.save();

    // Log Activity
    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user._id, 'resume_uploaded', { version, size: req.file.size });

    // Send Alert Notification
    const { sendNotification } = require('../services/notifications/alertNotifier');
    await sendNotification(req.user._id, {
      title: 'Resume Uploaded & Parsed!',
      message: `Successfully uploaded version V${version}. AI parsed skills and experiences.`,
      type: 'resume_parsed',
      actionUrl: '/workspace?tab=coach'
    });

    res.status(201).json(newVersion);
  } catch (error) {
    next(error);
  }
}

/**
 * Gets all resume uploads list for the user.
 */
async function getHistory(req, res, next) {
  try {
    const history = await ResumeVersion.find({ userId: req.user._id }).sort({ version: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
}

/**
 * Downloads a specific resume PDF.
 */
async function downloadResume(req, res, next) {
  try {
    const resume = await ResumeVersion.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume version not found.' });
    }

    const filePath = path.resolve(__dirname, '..', resume.fileUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on local storage disk.' });
    }

    res.download(filePath, resume.fileName);
  } catch (error) {
    next(error);
  }
}

/**
 * Syncs parsed resume JSON parameters into the portfolio structured data directly.
 */
async function syncPortfolio(req, res, next) {
  const { id } = req.params;

  try {
    const resume = await ResumeVersion.findOne({ _id: id, userId: req.user._id });
    if (!resume || !resume.parsedData) {
      return res.status(400).json({ message: 'Valid parsed resume data is required to sync.' });
    }

    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found.' });
    }

    const parsed = resume.parsedData;

    // Convert skills string array from parser to sub-schemas
    const mappedSkills = (parsed.skills || []).map(skillName => {
      // Presets
      let category = 'Tools';
      const norm = skillName.toLowerCase();
      if (norm.includes('react') || norm.includes('next.js') || norm.includes('express')) category = 'Frameworks';
      else if (norm.includes('python') || norm.includes('javascript') || norm.includes('c++')) category = 'Languages';
      else if (norm.includes('mongo') || norm.includes('sql')) category = 'Databases';
      else if (norm.includes('aws') || norm.includes('docker')) category = 'Cloud';

      return {
        name: skillName,
        category,
        level: 'Intermediate'
      };
    });

    // Structure projects
    const mappedProjects = (parsed.projects || []).map(p => ({
      title: p.title || 'Project',
      description: p.description || 'Project description accomplishments.',
      techStack: p.techStack || [],
      metrics: [],
      screenshots: [],
      resumeBullets: []
    }));

    // Structure experience
    const mappedExperience = (parsed.experience || []).map(exp => ({
      role: exp.role || 'Role',
      company: exp.company || 'Company',
      startDate: '',
      endDate: exp.duration || '',
      description: (exp.bullets || []).join('\n'),
      metrics: [],
      skillsUsed: []
    }));

    // Structure education
    const mappedEducation = (parsed.education || []).map(edu => ({
      institution: edu.school || 'School',
      degree: edu.degree || 'Degree',
      endDate: edu.year || '',
      coursework: [],
      tags: []
    }));

    // Merge into structuredData
    portfolio.structuredData.personalInfo.fullName = parsed.name || portfolio.structuredData.personalInfo.fullName;
    portfolio.structuredData.personalInfo.email = parsed.email || portfolio.structuredData.personalInfo.email;
    portfolio.structuredData.skills = mappedSkills;
    portfolio.structuredData.projects = mappedProjects;
    portfolio.structuredData.experience = mappedExperience;
    portfolio.structuredData.education = mappedEducation;

    portfolio.markModified('structuredData');
    portfolio.draftStatus = 'draft';
    await portfolio.save();

    // Log Activity
    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user._id, 'portfolio_synced_from_resume', { resumeId: id });

    // Send Alert Notification
    const { sendNotification } = require('../services/notifications/alertNotifier');
    await sendNotification(req.user._id, {
      title: 'Portfolio Synced with Resume!',
      message: 'Your Builder Mode profile structured data has been successfully updated.',
      type: 'github_sync',
      actionUrl: '/workspace'
    });

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
}

/**
 * Checks ATS score of the resume parsedData against a job description.
 */
async function checkAts(req, res, next) {
  const { id } = req.params;
  const { jobDescription } = req.body;

  if (!jobDescription) {
    return res.status(400).json({ message: 'Job description is required.' });
  }

  try {
    const resume = await ResumeVersion.findOne({ _id: id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume version not found.' });
    }

    const resumeText = JSON.stringify(resume.parsedData || {});
    const analysis = await analyzeAtsScore(resumeText, jobDescription, req.user._id);

    // Save ATS analysis metrics
    resume.atsAnalysis = analysis;
    await resume.save();

    // Send Alert Notification
    const { sendNotification } = require('../services/notifications/alertNotifier');
    await sendNotification(req.user._id, {
      title: 'ATS Scan Completed!',
      message: `Your resume matched ${analysis.score}% against the target job description.`,
      type: 'ats_updated',
      actionUrl: '/workspace?tab=coach'
    });

    res.json(analysis);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadResume,
  getHistory,
  downloadResume,
  syncPortfolio,
  checkAts
};
