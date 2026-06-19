const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/portfolios/user/me
 * @desc    Get the current authenticated user's portfolio details
 */
router.get('/user/me', auth, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    // If user has no portfolio, create a template portfolio
    if (!portfolio) {
      const defaultMarkdown = `# ${req.user.name}\n\n## Professional Summary\nPassionate software engineer specializing in full-stack development. Add your summary here!\n\n## Tech Stack\n- Frontend: React.js, Tailwind CSS, JavaScript\n- Backend: Node.js, Express.js, MongoDB\n\n## Projects\n### Project 1: Portfolio Builder\nDeveloped an automated portfolio creation platform using React and Express.\n- **Tech**: Node.js, Express, MongoDB\n- **Impact**: Streamlined portfolio launch from hours to seconds.`;
      
      portfolio = new Portfolio({
        userId: req.user._id,
        markdown: defaultMarkdown,
        theme: 'DarkPro',
        title: `${req.user.name} - Professional Portfolio`
      });
      await portfolio.save();
    }
    
    res.json(portfolio);
  } catch (error) {
    console.error('Failed to retrieve portfolio:', error);
    res.status(500).json({ message: 'Server error retrieving portfolio' });
  }
});

/**
 * @route   GET /api/portfolios/:id
 * @desc    Get specific portfolio by ID (Public route, used to render deployed pages)
 */
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id).populate('userId', 'name email avatarUrl');
    if (!portfolio || portfolio.isDeleted) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.json(portfolio);
  } catch (error) {
    console.error('Failed to retrieve portfolio details:', error);
    res.status(500).json({ message: 'Server error retrieving portfolio details' });
  }
});

/**
 * @route   POST /api/portfolios
 * @desc    Save/Create or Update current user's portfolio
 */
router.post('/', auth, async (req, res) => {
  const { markdown, theme, title } = req.body;

  if (markdown === undefined) {
    return res.status(400).json({ message: 'Markdown content is required' });
  }

  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (portfolio) {
      // Versioning check: If the markdown is different, save the old version before updating
      if (portfolio.markdown !== markdown) {
        // Limit history to last 10 versions to prevent document bloat
        if (portfolio.versions.length >= 10) {
          portfolio.versions.shift(); // Remove oldest version
        }
        portfolio.versions.push({
          markdown: portfolio.markdown,
          createdAt: new Date()
        });
      }

      portfolio.markdown = markdown;
      portfolio.theme = theme || portfolio.theme;
      portfolio.title = title || portfolio.title;
      await portfolio.save();
      const logActivity = require('../utils/activityLogger');
      await logActivity(req.user._id, 'portfolio_updated', { portfolioId: portfolio._id });
    } else {
      portfolio = new Portfolio({
        userId: req.user._id,
        markdown,
        theme: theme || 'DarkPro',
        title: title || `${req.user.name} - Professional Portfolio`
      });
      await portfolio.save();
      const logActivity = require('../utils/activityLogger');
      await logActivity(req.user._id, 'portfolio_created', { portfolioId: portfolio._id });
    }

    res.json(portfolio);
  } catch (error) {
    console.error('Failed to save portfolio:', error);
    res.status(500).json({ message: 'Server error saving portfolio' });
  }
});

/**
 * @route   POST /api/portfolios/rollback
 * @desc    Rollback portfolio markdown to a previous version
 */
router.post('/rollback', auth, async (req, res) => {
  const { versionId } = req.body;

  if (!versionId) {
    return res.status(400).json({ message: 'Version ID is required' });
  }

  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Find the version
    const versionIndex = portfolio.versions.findIndex(v => v._id.toString() === versionId);
    if (versionIndex === -1) {
      return res.status(404).json({ message: 'Selected version not found' });
    }

    const selectedVersion = portfolio.versions[versionIndex];
    
    // Save current state to history before rolling back
    portfolio.versions.push({
      markdown: portfolio.markdown,
      createdAt: new Date()
    });

    // Set new markdown
    portfolio.markdown = selectedVersion.markdown;
    
    // Remove the rolled-back version and subsequent versions if desired, 
    // or just splice it. Let's keep all history but remove the rolled back one to avoid duplicates.
    portfolio.versions.splice(versionIndex, 1);

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    console.error('Failed to rollback portfolio:', error);
    res.status(500).json({ message: 'Server error rolling back version' });
  }
});

/**
 * @route   POST /api/portfolios/:id/contact
 * @desc    Submit a contact message to a specific portfolio (Public)
 */
router.post('/:id/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const portfolioId = req.params.id;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required' });
  }

  try {
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Save message
    const ContactMessage = require('../models/ContactMessage');
    const newMessage = new ContactMessage({
      portfolioId,
      name,
      email,
      message
    });
    await newMessage.save();

    // Increment submissions count in Analytic
    const Analytic = require('../models/Analytic');
    await Analytic.findOneAndUpdate(
      { portfolioId },
      { $inc: { contactSubmissions: 1 } },
      { upsert: true }
    );

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Failed to save contact message:', error);
    res.status(500).json({ message: 'Server error saving message' });
  }
});

/**
 * @route   GET /api/portfolios/user/messages
 * @desc    Get all contact messages for the current user's portfolio (Protected)
 */
router.get('/user/messages', auth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const ContactMessage = require('../models/ContactMessage');
    const messages = await ContactMessage.find({ portfolioId: portfolio._id }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Failed to fetch contact messages:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

module.exports = router;

