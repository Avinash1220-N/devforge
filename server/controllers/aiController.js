const Portfolio = require('../models/Portfolio');
const Notification = require('../models/Notification');
const { executeGeminiCall } = require('../services/ai/geminiService');
const { parseResumePdf } = require('../services/ai/resumeParser');
const { summarizeRepository } = require('../services/github/projectSummary');
const { analyzeAtsScore } = require('../services/ai/atsService');
const { auditPortfolio } = require('../services/ai/portfolioScore');

const careerFitPrompt = require('../prompts/careerFitPrompt');
const rewritePrompt = require('../prompts/rewritePrompt');
const portfolioGenPrompt = require('../prompts/portfolioGenPrompt');

const { 
  getUnreadCount, 
  markAllAsRead, 
  markNotificationAsRead 
} = require('../services/notifications/alertNotifier');

/**
 * Upload resume PDF, parse text, clean and structure details into DB.
 */
async function parseResume(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF resume file.' });
  }

  try {
    const parsedData = await parseResumePdf(req.file.buffer, req.user._id);

    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (portfolio) {
      portfolio.parsedData = parsedData;
      portfolio.structuredData.personalInfo.fullName = parsedData.name || portfolio.structuredData.personalInfo.fullName;
      portfolio.structuredData.personalInfo.email = parsedData.email || portfolio.structuredData.personalInfo.email;
      portfolio.markModified('structuredData');
      await portfolio.save();
    } else {
      portfolio = new Portfolio({
        userId: req.user._id,
        markdown: `# ${parsedData.name || req.user.name}\n\nLoading portfolio...`,
        parsedData,
        structuredDataVersion: '2.1'
      });
      await portfolio.save();
    }

    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user._id, 'resume_uploaded', { fileSize: req.file.size });

    res.json({
      success: true,
      message: 'Resume parsed and cached successfully!',
      parsedData
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Translate parsedData JSON into portfolio markdown.
 */
async function generatePortfolio(req, res, next) {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio || !portfolio.parsedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No parsed resume data found. Please parse a resume first.' 
      });
    }

    console.log('Generating markdown template from cached resume details...');
    const promptText = portfolioGenPrompt.buildPrompt(portfolio.parsedData);

    const markdown = await executeGeminiCall({
      userId: req.user._id,
      feature: 'portfolio-generate',
      promptText,
      version: portfolioGenPrompt.VERSION,
      rawInput: portfolio.parsedData,
      isJson: false
    });

    res.json({
      success: true,
      markdown
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate optimized description cards from repository metadata.
 */
async function projectSummary(req, res, next) {
  const { name, description, readme, topics, languages } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Repository name is required' });
  }

  try {
    const summaryCard = await summarizeRepository({
      name, description, readme, topics, languages
    }, req.user._id);

    res.json({
      success: true,
      project: summaryCard
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Analyze target job readiness and generate roadmaps.
 */
async function careerFit(req, res, next) {
  const { skills, targetRole } = req.body;
  if (!skills || !targetRole) {
    return res.status(400).json({ success: false, message: 'Current skills list and target role are required' });
  }

  try {
    const promptText = careerFitPrompt.buildPrompt(skills, targetRole);

    const fitAnalysis = await executeGeminiCall({
      userId: req.user._id,
      feature: 'career-fit',
      promptText,
      version: careerFitPrompt.VERSION,
      rawInput: { skillsCount: skills.length, targetRole },
      isJson: true
    });

    res.json({
      success: true,
      analysis: fitAnalysis
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Professionalize weak developer sentences into impact statements.
 */
async function rewrite(req, res, next) {
  const { text, role } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'Input text content to rewrite is required' });
  }

  try {
    const promptText = rewritePrompt.buildPrompt(text, role);

    const rewritten = await executeGeminiCall({
      userId: req.user._id,
      feature: 'rewrite',
      promptText,
      version: rewritePrompt.VERSION,
      rawInput: { textLength: text.length, role },
      isJson: false
    });

    res.json({
      success: true,
      rewrittenText: rewritten.trim()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Hybrid portfolio evaluations against target Job Descriptions.
 */
async function atsScore(req, res, next) {
  const { portfolioText, jobDescription } = req.body;
  if (!portfolioText || !jobDescription) {
    return res.status(400).json({ success: false, message: 'Portfolio text and job description are required' });
  }

  try {
    const analysis = await analyzeAtsScore(portfolioText, jobDescription, req.user._id);

    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user._id, 'ats_check', { jobLength: jobDescription.length });

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Perform scorecard audit of portfolio.
 */
async function portfolioScore(req, res, next) {
  const { portfolioId, portfolioText } = req.body;
  if (!portfolioId || !portfolioText) {
    return res.status(400).json({ success: false, message: 'Portfolio ID and markdown content are required' });
  }

  try {
    const auditRecord = await auditPortfolio(portfolioId, portfolioText, req.user._id);
    res.json({
      success: true,
      audit: auditRecord
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate STAR formatted accomplishments.
 */
async function generateStarBullets(req, res, next) {
  const { role, company, description } = req.body;
  if (!description) return res.status(400).json({ message: 'Experience description is required' });

  try {
    const prompt = `Convert the following developer work experience bullet points into professional, metric-focused statements using the STAR format (Situation, Task, Action, Result). Quantify output results where possible:
Role: ${role || 'Software Engineer'}
Company: ${company || 'Technology Company'}
Description: ${description}`;

    const starBullets = await executeGeminiCall({
      userId: req.user._id,
      feature: 'star-generator',
      promptText: prompt,
      version: '1.0',
      rawInput: { descriptionLength: description.length },
      isJson: false
    });

    res.json({ success: true, starBullets: starBullets.trim() });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate LinkedIn post promotion, recruiter summary, or technical summaries for projects.
 */
async function generateProjectAI(req, res, next) {
  const { title, description, techStack, type } = req.body;
  if (!title || !description) return res.status(400).json({ message: 'Project title and description are required' });

  try {
    let prompt = '';
    if (type === 'linkedin') {
      prompt = `Draft an engaging LinkedIn post announcing this project: "${title}". Tech stack: ${techStack?.join(', ')}. Description: ${description}. Include hashtags and hook sentences.`;
    } else if (type === 'recruiter') {
      prompt = `Write a short 2-sentence recruiter summary highlighting the technical metrics and outcomes of this project: "${title}". Tech stack: ${techStack?.join(', ')}. Description: ${description}.`;
    } else {
      prompt = `Provide a detailed technical architecture explanation and code implementation notes for project: "${title}". Tech stack: ${techStack?.join(', ')}. Description: ${description}.`;
    }

    const aiText = await executeGeminiCall({
      userId: req.user._id,
      feature: 'project-ai',
      promptText: prompt,
      version: '1.0',
      rawInput: { title, type },
      isJson: false
    });

    res.json({ success: true, output: aiText.trim() });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets notifications checklist.
 */
async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

/**
 * Counts unread notifications.
 */
async function getUnreadNotificationsCount(req, res, next) {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark specific notification as read.
 */
async function readNotification(req, res, next) {
  try {
    const alert = await markNotificationAsRead(req.params.id, req.user._id);
    res.json({ success: true, notification: alert });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read.
 */
async function readAllNotifications(req, res, next) {
  try {
    await markAllAsRead(req.user._id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  parseResume,
  generatePortfolio,
  projectSummary,
  careerFit,
  rewrite,
  atsScore,
  portfolioScore,
  generateStarBullets,
  generateProjectAI,
  getNotifications,
  getUnreadNotificationsCount,
  readNotification,
  readAllNotifications
};
