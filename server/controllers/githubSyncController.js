const GitHubSyncSuggestion = require('../models/GitHubSyncSuggestion');
const Portfolio = require('../models/Portfolio');
const { scanUserRepositories } = require('../services/github/githubSync');

/**
 * Scan user's GitHub repositories and generate sync suggestion entries.
 */
async function scanRepos(req, res, next) {
  try {
    console.log(`[GitHub Sync Controller] Starting scan for user: ${req.user._id}`);
    const suggestions = await scanUserRepositories(req.user._id);
    res.json({ success: true, count: suggestions.length, suggestions });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets all pending suggestions for the user.
 */
async function getSuggestions(req, res, next) {
  try {
    const suggestions = await GitHubSyncSuggestion.find({
      userId: req.user._id,
      status: 'pending'
    }).sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
}

/**
 * Approve a repository suggestion, adding the repository details into portfolio projects.
 */
async function approveSuggestion(req, res, next) {
  const { id } = req.params;

  try {
    const suggestion = await GitHubSyncSuggestion.findOne({ _id: id, userId: req.user._id });
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found.' });
    if (suggestion.status !== 'pending') {
      return res.status(400).json({ message: 'Suggestion is already processed.' });
    }

    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found.' });

    // Append project
    portfolio.structuredData.projects.push({
      title: suggestion.projectData.title,
      description: suggestion.projectData.description,
      techStack: suggestion.projectData.technologies,
      githubUrl: suggestion.projectData.githubUrl,
      liveUrl: '',
      videoDemoUrl: '',
      teamSize: 1,
      duration: '',
      role: 'Creator',
      metrics: [],
      screenshots: [],
      resumeBullets: []
    });

    portfolio.markModified('structuredData');
    portfolio.draftStatus = 'draft';
    await portfolio.save();

    // Update suggestion
    suggestion.status = 'approved';
    suggestion.approvedProjectId = portfolio._id;
    suggestion.reviewedAt = new Date();
    suggestion.reviewedBy = req.user._id;
    await suggestion.save();

    res.json({ success: true, message: 'Suggestion approved and project added successfully!', portfolio });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject a repository suggestion.
 */
async function rejectSuggestion(req, res, next) {
  const { id } = req.params;

  try {
    const suggestion = await GitHubSyncSuggestion.findOne({ _id: id, userId: req.user._id });
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found.' });
    if (suggestion.status !== 'pending') {
      return res.status(400).json({ message: 'Suggestion is already processed.' });
    }

    suggestion.status = 'rejected';
    suggestion.reviewedAt = new Date();
    suggestion.reviewedBy = req.user._id;
    await suggestion.save();

    res.json({ success: true, message: 'Suggestion rejected successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  scanRepos,
  getSuggestions,
  approveSuggestion,
  rejectSuggestion
};
