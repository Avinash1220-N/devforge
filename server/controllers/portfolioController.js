const Portfolio = require('../models/Portfolio');
const PortfolioVersion = require('../models/PortfolioVersion');
const { migrateV1ToV21 } = require('../services/portfolio/migrationService');
const { compileStructuredDataToMarkdown } = require('../services/portfolio/compiler');

/**
 * Gets or creates the authenticated user's portfolio, applying V2.1 migrations if legacy.
 */
async function getMe(req, res, next) {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      // Create initial V2.1 structured template portfolio
      const defaultStructuredData = {
        personalInfo: {
          fullName: req.user.name || 'Developer',
          email: req.user.email || '',
          title: 'Software Engineer',
          headline: 'Full Stack Engineer',
          summary: 'Passionate developer building modern web architectures.',
          availability: 'Open to Work',
          photoUrl: req.user.avatarUrl || '',
          resumeUrl: ''
        },
        socials: {
          githubUrl: `https://github.com/${req.user.githubId.startsWith('mock_') ? 'mock-dev' : req.user.githubId}`,
          linkedinUrl: '',
          portfolioWebsite: '',
          leetCode: '',
          codeChef: '',
          codeforces: '',
          hackerRank: '',
          kaggle: '',
          medium: '',
          youtube: ''
        },
        skills: [
          { name: 'JavaScript', category: 'Languages', level: 'Advanced' },
          { name: 'React.js', category: 'Frameworks', level: 'Advanced' },
          { name: 'Node.js', category: 'Frameworks', level: 'Intermediate' },
          { name: 'MongoDB', category: 'Databases', level: 'Intermediate' }
        ],
        education: [],
        experience: [],
        projects: [
          {
            title: 'Project 1: Automated Portfolio Builder',
            description: 'Created a developer portfolio and career operating engine supporting visual builders and markdown editors.',
            techStack: ['React', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB'],
            githubUrl: '',
            liveUrl: '',
            teamSize: 1,
            metrics: [
              { label: 'Latency improvement', value: '30%' },
              { label: 'Time saved', value: '4 hours' }
            ]
          }
        ],
        activities: [],
        achievements: [],
        certifications: [],
        publications: [],
        customSections: []
      };

      // Compile initial markdown from structured details
      const defaultMarkdown = compileStructuredDataToMarkdown(defaultStructuredData);

      portfolio = new Portfolio({
        userId: req.user._id,
        markdown: defaultMarkdown,
        theme: 'DarkPro',
        title: `${req.user.name || 'Developer'} - Professional Portfolio`,
        structuredData: defaultStructuredData,
        structuredDataVersion: '2.1',
        draftStatus: 'draft'
      });
      await portfolio.save();
    } else if (portfolio.structuredDataVersion !== '2.1') {
      // Legacy document found -> Run migration
      await migrateV1ToV21(portfolio);
      // Reload updated document
      portfolio = await Portfolio.findOne({ userId: req.user._id });
    }

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
}

/**
 * Gets a public portfolio by ID.
 */
async function getById(req, res, next) {
  try {
    const portfolio = await Portfolio.findById(req.params.id).populate('userId', 'name email avatarUrl');
    if (!portfolio || portfolio.isDeleted) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    res.json(portfolio);
  } catch (error) {
    next(error);
  }
}

/**
 * Saves draft structuredData and custom settings.
 */
async function saveDraft(req, res, next) {
  const { structuredData, theme, title, themeSettings, seoSettings, sectionOrder, enabledSections } = req.body;

  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Save inputs
    if (structuredData) {
      portfolio.structuredData = structuredData;
      portfolio.markModified('structuredData');
    }
    
    portfolio.theme = theme || portfolio.theme;
    portfolio.title = title || portfolio.title;
    portfolio.draftStatus = 'draft'; // Reverts to draft on edits

    if (themeSettings) {
      portfolio.themeSettings = themeSettings;
      portfolio.markModified('themeSettings');
    }

    if (seoSettings) {
      portfolio.seoSettings = seoSettings;
      portfolio.markModified('seoSettings');
    }

    if (sectionOrder) {
      portfolio.sectionOrder = sectionOrder;
    }

    if (enabledSections) {
      portfolio.enabledSections = enabledSections;
      portfolio.markModified('enabledSections');
    }

    await portfolio.save();

    // Log Activity
    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user._id, 'portfolio_draft_saved', { portfolioId: portfolio._id });

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
}

/**
 * Updates status to review before publish approval.
 */
async function submitReview(req, res, next) {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

    portfolio.draftStatus = 'review';
    await portfolio.save();

    res.json({ success: true, draftStatus: 'review' });
  } catch (error) {
    next(error);
  }
}

/**
 * Compiles structured JSON data into Markdown, updates draftStatus, and archives a version snapshot.
 */
async function publish(req, res, next) {
  const { changeSummary } = req.body;

  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

    // Compile structured JSON state into markdown output
    const compiledMarkdown = compileStructuredDataToMarkdown(portfolio.structuredData);
    portfolio.markdown = compiledMarkdown;
    portfolio.draftStatus = 'published';

    // Get current version count to increment
    const versionNumber = (await PortfolioVersion.countDocuments({ portfolioId: portfolio._id })) + 1;

    // Save snapshot version record
    const newVersion = new PortfolioVersion({
      portfolioId: portfolio._id,
      versionNumber,
      markdown: compiledMarkdown,
      structuredData: portfolio.structuredData,
      theme: portfolio.theme,
      themeSettings: portfolio.themeSettings,
      changeSummary: changeSummary || `Publish Version ${versionNumber}`,
      publishedBy: req.user._id,
      isRollbackPoint: false
    });
    await newVersion.save();

    // Limit legacy array history on the main document
    if (portfolio.versions.length >= 10) {
      portfolio.versions.shift();
    }
    portfolio.versions.push({
      markdown: compiledMarkdown,
      createdAt: new Date()
    });

    await portfolio.save();

    // Log Activity
    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user._id, 'portfolio_published', { portfolioId: portfolio._id, version: versionNumber });

    // Send Alert Notification
    const { sendNotification } = require('../services/notifications/alertNotifier');
    await sendNotification(req.user._id, {
      title: 'Portfolio Successfully Published!',
      message: `Your developer portfolio has been deployed to the live target. Version: V${versionNumber}`,
      type: 'portfolio_published',
      actionUrl: '/workspace?tab=versions'
    });

    res.json({ portfolio, version: newVersion });
  } catch (error) {
    next(error);
  }
}

/**
 * Reverts the draft and markdown state to matching version snapshot configurations.
 */
async function rollback(req, res, next) {
  const { versionId } = req.body;
  if (!versionId) return res.status(400).json({ message: 'Version ID is required' });

  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

    const targetVersion = await PortfolioVersion.findOne({ _id: versionId, portfolioId: portfolio._id });
    if (!targetVersion) return res.status(404).json({ message: 'Version not found' });

    // Revert state values
    portfolio.structuredData = targetVersion.structuredData;
    portfolio.markdown = targetVersion.markdown;
    portfolio.theme = targetVersion.theme;
    portfolio.themeSettings = targetVersion.themeSettings;
    portfolio.draftStatus = 'draft'; // Rollbacks set status back to draft for adjustments

    // Log rollback marker
    targetVersion.isRollbackPoint = true;
    await targetVersion.save();

    await portfolio.save();

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
}

/**
 * Gets all archived snapshots list.
 */
async function getVersions(req, res, next) {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

    const versions = await PortfolioVersion.find({ portfolioId: portfolio._id }).sort({ versionNumber: -1 });
    res.json(versions);
  } catch (error) {
    next(error);
  }
}

/**
 * Compiles robots.txt dynamically.
 */
async function getRobots(req, res) {
  const portfolioId = req.params.id;
  const content = `User-agent: *\nAllow: /\nSitemap: http://localhost:5000/api/portfolios/${portfolioId}/sitemap.xml\n`;
  res.type('text/plain').send(content);
}

/**
 * Compiles sitemap.xml dynamically.
 */
async function getSitemap(req, res) {
  const portfolioId = req.params.id;
  const lastMod = new Date().toISOString().substring(0, 10);
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://localhost:5173/portfolio/${portfolioId}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  res.type('application/xml').send(content);
}

module.exports = {
  getMe,
  getById,
  saveDraft,
  submitReview,
  publish,
  rollback,
  getVersions,
  getRobots,
  getSitemap
};
