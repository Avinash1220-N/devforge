const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const { decrypt } = require('../utils/encrypt');
const auth = require('../middleware/auth');

/**
 * Helper to fetch data from GitHub API with token
 */
const githubFetch = async (url, token) => {
  return axios.get(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'DevForge-AI'
    }
  });
};

/**
 * @route   GET /api/github/repos
 * @desc    Fetch authenticated user's GitHub repositories
 */
router.get('/repos', auth, async (req, res) => {
  try {
    // 1. Fetch user with the encrypted githubAccessToken selected
    const userWithToken = await User.findById(req.user._id).select('+githubAccessToken');
    
    // Check if it's a mock user
    if (userWithToken.githubId.startsWith('mock_')) {
      // Return realistic mock projects
      const mockRepos = [
        {
          id: 101,
          name: 'sign-language-recognition',
          description: 'A real-time sign language recognition system using deep learning and OpenCV.',
          html_url: 'https://github.com/mock-dev/sign-language-recognition',
          language: 'Python',
          stargazers_count: 24,
          forks_count: 5,
          updated_at: new Date().toISOString()
        },
        {
          id: 102,
          name: 'intelligent-portfolio-generator',
          description: 'DevForge AI engine built with Next.js, Express, and Google Gemini API.',
          html_url: 'https://github.com/mock-dev/intelligent-portfolio-generator',
          language: 'JavaScript',
          stargazers_count: 42,
          forks_count: 12,
          updated_at: new Date().toISOString()
        },
        {
          id: 103,
          name: 'distributed-crawler-go',
          description: 'A high-throughput distributed web crawler engineered in Golang.',
          html_url: 'https://github.com/mock-dev/distributed-crawler-go',
          language: 'Go',
          stargazers_count: 89,
          forks_count: 22,
          updated_at: new Date().toISOString()
        },
        {
          id: 104,
          name: 'smart-home-iot',
          description: 'IoT sensor dashboard and automated control platform for home automation.',
          html_url: 'https://github.com/mock-dev/smart-home-iot',
          language: 'TypeScript',
          stargazers_count: 15,
          forks_count: 2,
          updated_at: new Date().toISOString()
        }
      ];
      return res.json({ repos: mockRepos, username: userWithToken.name });
    }

    if (!userWithToken.githubAccessToken) {
      return res.status(400).json({ message: 'GitHub account is not connected' });
    }

    // 2. Decrypt token
    const token = decrypt(userWithToken.githubAccessToken);
    if (!token) {
      return res.status(401).json({ message: 'Invalid or corrupted GitHub token' });
    }

    // 3. Find user login username from profile (in case user name != login)
    // Fetch profile details from GitHub to resolve login handle
    const profileRes = await githubFetch('https://api.github.com/user', token);
    const login = profileRes.data.login;

    // 4. Fetch repositories
    // Fetch up to 30 public repos, sorted by recently updated
    const reposRes = await githubFetch(`https://api.github.com/user/repos?type=owner&sort=updated&per_page=30`, token);
    
    const formattedRepos = reposRes.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description || '',
      html_url: repo.html_url,
      language: repo.language || 'Other',
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks,
      updated_at: repo.updated_at
    }));

    res.json({ repos: formattedRepos, username: login });

  } catch (error) {
    console.error('Failed to fetch github repos:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to retrieve GitHub repositories' });
  }
});

/**
 * @route   GET /api/github/repos/:owner/:repo/readme
 * @desc    Fetch the raw content of README.md for a repository
 */
router.get('/repos/:owner/:repo/readme', auth, async (req, res) => {
  const { owner, repo } = req.params;

  try {
    const userWithToken = await User.findById(req.user._id).select('+githubAccessToken');
    
    // Check if it's a mock user
    if (userWithToken.githubId.startsWith('mock_')) {
      const mockReadme = `# ${repo}\n\nThis is a mock project README for **${repo}**. It describes the installation, tech stack, and structure of this simulated workspace.\n\n## Tech Stack\n- Python\n- TensorFlow\n- Flask\n\n## Usage\nRun \`python main.py\` to start the engine.`;
      return res.json({ readme: mockReadme });
    }

    if (!userWithToken.githubAccessToken) {
      return res.status(400).json({ message: 'GitHub account is not connected' });
    }

    const token = decrypt(userWithToken.githubAccessToken);
    
    // Fetch README from GitHub API
    const readmeRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3.raw', // Request raw text
        'User-Agent': 'DevForge-AI'
      }
    });

    res.json({ readme: readmeRes.data });

  } catch (error) {
    console.error(`Failed to fetch readme for ${owner}/${repo}:`, error.message);
    // If not found, return empty string instead of crashing
    res.status(error.response?.status || 500).json({ 
      message: 'Failed to retrieve README.md file',
      readme: '' 
    });
  }
});

module.exports = router;
