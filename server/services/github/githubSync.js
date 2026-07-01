const axios = require('axios');
const User = require('../../models/User');
const Portfolio = require('../../models/Portfolio');
const GitHubSyncSuggestion = require('../../models/GitHubSyncSuggestion');
const Notification = require('../../models/Notification');
const { decrypt } = require('../../utils/encrypt');

/**
 * Scan a user's GitHub repositories and create sync suggestions if new repos are found.
 * 
 * @param {string} userId - User identifier
 * @returns {Promise<object>} - Array of suggestions generated
 */
async function scanUserRepositories(userId) {
  try {
    const user = await User.findById(userId).select('+githubAccessToken');
    if (!user) throw new Error('User not found');

    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) throw new Error('Portfolio not found');

    let repos = [];

    // 1. Fetch repositories (supporting mock credentials)
    if (user.githubId.startsWith('mock_')) {
      // Mock Repository dataset
      repos = [
        {
          id: 101,
          name: 'sign-language-recognition',
          description: 'A real-time sign language recognition system using deep learning and OpenCV.',
          html_url: 'https://github.com/mock-dev/sign-language-recognition',
          language: 'Python'
        },
        {
          id: 102,
          name: 'intelligent-portfolio-generator',
          description: 'DevForge AI engine built with Next.js, Express, and Google Gemini API.',
          html_url: 'https://github.com/mock-dev/intelligent-portfolio-generator',
          language: 'JavaScript'
        },
        {
          id: 103,
          name: 'distributed-crawler-go',
          description: 'A high-throughput distributed web crawler engineered in Golang.',
          html_url: 'https://github.com/mock-dev/distributed-crawler-go',
          language: 'Go'
        },
        {
          id: 104,
          name: 'smart-home-iot',
          description: 'IoT sensor dashboard and automated control platform for home automation.',
          html_url: 'https://github.com/mock-dev/smart-home-iot',
          language: 'TypeScript'
        },
        {
          id: 105,
          name: 'newly-created-repo-cloud',
          description: 'A newly added public repository demonstrating cloud automation.',
          html_url: 'https://github.com/mock-dev/newly-created-repo-cloud',
          language: 'Python'
        }
      ];
    } else {
      if (!user.githubAccessToken) {
        throw new Error('GitHub account is not connected');
      }

      const token = decrypt(user.githubAccessToken);
      if (!token) throw new Error('Invalid or corrupted GitHub token');

      // Fetch public repos from GitHub
      const response = await axios.get('https://api.github.com/user/repos?type=owner&sort=updated&per_page=30', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'DevForge-AI'
        }
      });
      repos = response.data;
    }

    const suggestions = [];

    // 2. Identify new repositories (not matching any project githubUrl)
    const existingGithubUrls = (portfolio.structuredData?.projects || [])
      .map(p => (p.githubUrl || '').toLowerCase().trim())
      .filter(Boolean);

    for (const repo of repos) {
      const repoUrl = repo.html_url.toLowerCase().trim();
      
      // If project URL not present in current list of projects
      if (!existingGithubUrls.includes(repoUrl)) {
        // Check if suggestion already exists to avoid duplication
        const existingSuggestion = await GitHubSyncSuggestion.findOne({
          userId,
          repositoryName: repo.name,
          status: 'pending'
        });

        if (!existingSuggestion) {
          const suggestion = new GitHubSyncSuggestion({
            userId,
            repositoryName: repo.name,
            suggestionType: 'new_repo',
            summary: `Found new repository "${repo.name}" on GitHub. Ready to optimize project description.`,
            projectData: {
              title: repo.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              description: repo.description || 'Developed a public software utility.',
              technologies: repo.language ? [repo.language] : [],
              githubUrl: repo.html_url
            },
            status: 'pending'
          });

          await suggestion.save();
          suggestions.push(suggestion);

          // Push system notification for sync approval
          const notification = new Notification({
            userId,
            title: 'New GitHub Project Suggestion',
            message: `New repository "${repo.name}" is available for sync.`,
            type: 'github_sync',
            actionUrl: `/workspace?tab=github&suggestionId=${suggestion._id}`
          });
          await notification.save();
        }
      }
    }

    return suggestions;
  } catch (err) {
    console.error('GitHub repositories sync scanning failure:', err.message);
    throw err;
  }
}

module.exports = {
  scanUserRepositories
};
