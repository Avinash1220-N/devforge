const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const PortfolioAudit = require('../models/PortfolioAudit');

// Services imports
const { executeGeminiCall } = require('../services/geminiService');
const { parseResumePdf } = require('../services/resumeParser');
const { analyzeAtsScore } = require('../services/atsService');
const { summarizeRepository } = require('../services/projectSummary');
const { auditPortfolio } = require('../services/portfolioScore');

// Prompts imports (for inline routing use)
const careerFitPrompt = require('../prompts/careerFitPrompt');
const rewritePrompt = require('../prompts/rewritePrompt');
const portfolioGenPrompt = require('../prompts/portfolioGenPrompt');

// Multer upload boundaries (5MB maximum size)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * Helper error mapping wrapper for Multer limits
 */
const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single('resume');
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Upload failed: Resume size exceeds 5MB limit.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(550).json({ success: false, message: err.message });
    }
    next();
  });
};

/**
 * @route   POST /api/ai/parse-resume
 * @desc    Upload resume PDF, parse text, clean and structure details into DB
 */
router.post('/parse-resume', auth, handleUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF resume file.' });
  }

  try {
    // 1. Run resume parsing service
    const parsedData = await parseResumePdf(req.file.buffer, req.user._id);

    // 2. Cache/Save the structured parsedData in the user's Portfolio document
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (portfolio) {
      portfolio.parsedData = parsedData;
      await portfolio.save();
    } else {
      portfolio = new Portfolio({
        userId: req.user._id,
        markdown: `# ${parsedData.name || req.user.name}\n\nLoading portfolio...`,
        parsedData
      });
      await portfolio.save();
    }

    // Log Activity
    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user._id, 'resume_uploaded', { fileSize: req.file.size });

    res.json({
      success: true,
      message: 'Resume parsed and cached successfully!',
      parsedData
    });

  } catch (error) {
    console.error('API parse-resume error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to parse resume PDF' });
  }
});

/**
 * @route   POST /api/ai/generate-portfolio
 * @desc    Translate saved parsedData JSON into portfolio markdown
 */
router.post('/generate-portfolio', auth, async (req, res) => {
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
    console.error('API generate-portfolio error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate markdown from resume details.' });
  }
});

/**
 * @route   POST /api/ai/project-summary
 * @desc    Generate optimized description cards from repository metadata
 */
router.post('/project-summary', auth, async (req, res) => {
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
    console.error('API project-summary error:', error.message);
    res.status(550).json({ success: false, message: 'Failed to summarize project' });
  }
});

/**
 * @route   POST /api/ai/career-fit
 * @desc    Analyze target job readiness and generate roadmaps
 */
router.post('/career-fit', auth, async (req, res) => {
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
    console.error('API career-fit error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to execute career fit analysis' });
  }
});

/**
 * @route   POST /api/ai/rewrite
 * @desc    Professionalize weak developer sentences into impact statements
 */
router.post('/rewrite', auth, async (req, res) => {
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
    console.error('API rewrite error:', error.message);
    res.status(550).json({ success: false, message: 'Failed to rewrite text' });
  }
});

/**
 * @route   POST /api/ai/ats-score
 * @desc    Hybrid portfolio evaluations against target Job Descriptions
 */
router.post('/ats-score', auth, async (req, res) => {
  const { portfolioText, jobDescription } = req.body;

  if (!portfolioText || !jobDescription) {
    return res.status(400).json({ success: false, message: 'Portfolio text and job description are required' });
  }

  try {
    const analysis = await analyzeAtsScore(portfolioText, jobDescription, req.user._id);

    // Log Activity
    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user._id, 'ats_check', { jobLength: jobDescription.length });

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('API ats-score error:', error.message);
    res.status(500).json({ success: false, message: 'ATS evaluation analysis failed' });
  }
});

/**
 * @route   POST /api/ai/portfolio-score
 * @desc    Perform scorecard audit of portfolio and save to historical database logs
 */
router.post('/portfolio-score', auth, async (req, res) => {
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
    console.error('API portfolio-score error:', error.message);
    res.status(500).json({ success: false, message: 'Portfolio score audit failed' });
  }
});

/**
 * @route   GET /api/ai/portfolio-audits/:portfolioId
 * @desc    Get historical score audits log for trending graphs
 */
router.get('/portfolio-audits/:portfolioId', auth, async (req, res) => {
  try {
    const audits = await PortfolioAudit.find({ 
      portfolioId: req.params.portfolioId, 
      isDeleted: false 
    }).sort({ createdAt: 1 }); // Sorted chronologically to plot charts easily

    res.json({
      success: true,
      audits
    });
  } catch (error) {
    console.error('API get portfolio-audits error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit history logs' });
  }
});

module.exports = router;
