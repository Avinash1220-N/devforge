const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Analytic = require('../models/Analytic');
const { decrypt } = require('../utils/encrypt');
const auth = require('../middleware/auth');

/**
 * Helper to execute GitHub API requests
 */
const githubReq = async (method, url, token, data = null) => {
  return axios({
    method,
    url,
    data,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'DevForge-AI'
    }
  });
};

/**
 * @route   POST /api/deploy/gh-pages
 * @desc    Deploy portfolio to GitHub Pages
 */
router.post('/gh-pages', auth, async (req, res) => {
  const { portfolioId, repoName, htmlContent, themeName } = req.body;

  if (!portfolioId || !repoName || !htmlContent) {
    return res.status(400).json({ message: 'Missing portfolioId, repoName, or htmlContent' });
  }

  try {
    // 1. Fetch user token
    const userWithToken = await User.findById(req.user._id).select('+githubAccessToken');
    
    // Check if it's a mock user
    if (userWithToken.githubId.startsWith('mock_')) {
      const mockUsername = userWithToken.name.toLowerCase().replace(/\s+/g, '-');
      const mockUrl = `https://${mockUsername}.github.io/${repoName}`;
      
      // Update portfolio in DB
      const portfolio = await Portfolio.findById(portfolioId);
      if (portfolio) {
        portfolio.deploymentUrl = mockUrl;
        portfolio.githubRepoName = repoName;
        portfolio.theme = themeName || portfolio.theme;
        await portfolio.save();

        // Initialize Analytics record
        await Analytic.findOneAndUpdate(
          { portfolioId: portfolio._id },
          { portfolioId: portfolio._id },
          { upsert: true, new: true }
        );

        // Log Activity
        const logActivity = require('../utils/activityLogger');
        await logActivity(req.user._id, 'portfolio_deployed', { portfolioId: portfolio._id, repoName, method: 'mock' });
      }

      return res.json({
        success: true,
        message: 'Mock deployment successful!',
        url: mockUrl
      });
    }

    if (!userWithToken.githubAccessToken) {
      return res.status(400).json({ message: 'GitHub account is not connected. Deployments require OAuth.' });
    }

    const token = decrypt(userWithToken.githubAccessToken);
    if (!token) {
      return res.status(401).json({ message: 'Failed to decrypt GitHub credentials.' });
    }

    // 2. Fetch owner's username
    const profileRes = await githubReq('GET', 'https://api.github.com/user', token);
    const username = profileRes.data.login;

    // 3. Create repository if it doesn't exist
    let repoExists = false;
    try {
      await githubReq('GET', `https://api.github.com/repos/${username}/${repoName}`, token);
      repoExists = true;
    } catch (err) {
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    if (!repoExists) {
      console.log(`Creating repository: ${repoName} for user: ${username}`);
      await githubReq('POST', 'https://api.github.com/user/repos', token, {
        name: repoName,
        description: 'Developer portfolio created automatically by DevForge AI.',
        private: false, // Must be public for free GitHub Pages
        has_issues: false,
        has_projects: false,
        has_wiki: false
      });
      
      // Wait briefly for repository creation to propagate in GitHub's database
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 4. Commit index.html using the GitHub contents API
    // Check if index.html already exists to obtain its SHA
    let existingFileSha = null;
    try {
      const fileRes = await githubReq('GET', `https://api.github.com/repos/${username}/${repoName}/contents/index.html`, token);
      existingFileSha = fileRes.data.sha;
    } catch (err) {
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    const base64Content = Buffer.from(htmlContent).toString('base64');
    
    // Commit the index.html file
    console.log(`Committing index.html to ${username}/${repoName}`);
    await githubReq('PUT', `https://api.github.com/repos/${username}/${repoName}/contents/index.html`, token, {
      message: 'Deploy latest portfolio layout by DevForge AI',
      content: base64Content,
      sha: existingFileSha // Send SHA if updating, omit if creating
    });

    // 5. Configure GitHub Pages
    let pagesUrl = `https://${username}.github.io/${repoName}/`;
    try {
      console.log(`Enabling GitHub Pages for ${username}/${repoName}`);
      await githubReq('POST', `https://api.github.com/repos/${username}/${repoName}/pages`, token, {
        source: {
          branch: 'main',
          path: '/'
        }
      });
    } catch (err) {
      // If it returns 409, pages is already enabled. That's fine.
      // If it fails because there is no 'main' branch (e.g. repo creation delay or default branch is master)
      // Let's try master
      if (err.response?.status === 422 || err.response?.status === 409) {
        console.log('GitHub Pages already active or auto-configuring.');
      } else {
        try {
          await githubReq('POST', `https://api.github.com/repos/${username}/${repoName}/pages`, token, {
            source: {
              branch: 'master',
              path: '/'
            }
          });
        } catch (innerErr) {
          console.warn('Could not explicitly set GitHub Pages config (it may activate automatically):', innerErr.message);
        }
      }
    }

    // 6. Update portfolio record in database
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found to link deployment.' });
    }

    portfolio.deploymentUrl = pagesUrl;
    portfolio.githubRepoName = repoName;
    portfolio.theme = themeName || portfolio.theme;
    await portfolio.save();

    // 7. Ensure Analytic summary record exists
    await Analytic.findOneAndUpdate(
      { portfolioId: portfolio._id },
      { portfolioId: portfolio._id },
      { upsert: true, new: true }
    );

    // Log Activity
    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user._id, 'portfolio_deployed', { portfolioId: portfolio._id, repoName, method: 'github_pages' });

    res.json({
      success: true,
      message: 'Portfolio successfully deployed to GitHub Pages!',
      url: pagesUrl
    });

  } catch (error) {
    console.error('Failed to deploy to GitHub Pages:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to deploy portfolio to GitHub Pages.', 
      error: error.response?.data?.message || error.message 
    });
  }
});

module.exports = router;
