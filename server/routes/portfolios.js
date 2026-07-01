const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const portfolioController = require('../controllers/portfolioController');

// V2.1 Portfolio Routes
router.get('/user/me', auth, portfolioController.getMe);
router.post('/draft', auth, portfolioController.saveDraft);
router.post('/review', auth, portfolioController.submitReview);
router.post('/publish', auth, portfolioController.publish);
router.post('/rollback', auth, portfolioController.rollback);
router.get('/user/versions', auth, portfolioController.getVersions);
router.get('/:id/robots.txt', portfolioController.getRobots);
router.get('/:id/sitemap.xml', portfolioController.getSitemap);

// Public route to fetch portfolio details by ID
router.get('/:id', portfolioController.getById);

// --- Backward Compatibility Support (Phase 1-4 endpoints) ---

// Map legacy POST "/" to saveDraft for seamless frontend compatibility
router.post('/', auth, portfolioController.saveDraft);

// Map legacy rollback route
router.post('/rollback-legacy', auth, portfolioController.rollback);

// Legacy Submit Contact message (keep inline for simplicity)
router.post('/:id/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const portfolioId = req.params.id;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required' });
  }

  try {
    const PortfolioModel = require('../models/Portfolio');
    const portfolio = await PortfolioModel.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

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

// Legacy Get messages
router.get('/user/messages', auth, async (req, res) => {
  try {
    const PortfolioModel = require('../models/Portfolio');
    const portfolio = await PortfolioModel.findOne({ userId: req.user._id });
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
