const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { encrypt } = require('../utils/encrypt');
const auth = require('../middleware/auth');

// Create JWT helper
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'devforge_local_jwt_secret_token_12345',
    { expiresIn: '30d' }
  );

  // Set as HttpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production, false in development
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  return token;
};

/**
 * @route   GET /api/auth/github/callback
 * @desc    GitHub OAuth Callback
 */
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth-success?error=no_code`);
  }

  try {
    // 1. Exchange code for github access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token, error, error_description } = tokenResponse.data;
    if (error) {
      console.error('GitHub token exchange error:', error_description);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth-success?error=${error}`);
    }

    // 2. Fetch user profile from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const githubUser = userResponse.data;

    // 3. Fetch user email from GitHub (emails can sometimes be private/null in standard profile)
    let email = githubUser.email;
    if (!email) {
      try {
        const emailsResponse = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const primaryEmail = emailsResponse.data.find(e => e.primary && e.verified);
        email = primaryEmail ? primaryEmail.email : emailsResponse.data[0]?.email;
      } catch (err) {
        console.warn('Failed to fetch user emails from GitHub:', err.message);
      }
    }

    // 4. Encrypt the access token before saving to database
    const encryptedToken = encrypt(access_token);

    // 5. Find or create user
    let user = await User.findOne({ githubId: githubUser.id.toString() });

    if (user) {
      user.name = githubUser.name || githubUser.login;
      user.email = email || user.email;
      user.avatarUrl = githubUser.avatar_url;
      user.githubAccessToken = encryptedToken;
      await user.save();
    } else {
      // First user is admin (optional helper for testing)
      const count = await User.countDocuments();
      const role = count === 0 ? 'admin' : 'user';

      user = new User({
        githubId: githubUser.id.toString(),
        name: githubUser.name || githubUser.login,
        email: email || `${githubUser.login}@github.com`,
        avatarUrl: githubUser.avatar_url,
        role,
        githubAccessToken: encryptedToken
      });
      await user.save();
    }

    // 6. Generate JWT and set HttpOnly Cookie
    generateTokenAndSetCookie(res, user._id);

    // Log Activity
    const logActivity = require('../utils/activityLogger');
    await logActivity(user._id, 'login', { method: 'github_oauth' });

    // 7. Redirect back to frontend
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth-success?status=success`);

  } catch (error) {
    console.error('OAuth Callback failure:', error.response?.data || error.message);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth-success?error=server_error`);
  }
});

/**
 * @route   POST /api/auth/mock-login
 * @desc    Simulated login for local testing without OAuth configurations
 */
router.post('/mock-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Forbidden. Mock login disabled in production.' });
  }

  const { username, role } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    const mockId = `mock_${username.toLowerCase()}`;
    let user = await User.findOne({ githubId: mockId });

    if (!user) {
      user = new User({
        githubId: mockId,
        name: username,
        email: `${username.toLowerCase()}@mockforge.com`,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
        role: role === 'admin' ? 'admin' : 'user',
        githubAccessToken: encrypt('mock_access_token_value')
      });
      await user.save();
    } else if (role && user.role !== role) {
      user.role = role;
      await user.save();
    }

    const token = generateTokenAndSetCookie(res, user._id);
    const logActivity = require('../utils/activityLogger');
    await logActivity(user._id, 'login', { method: 'mock_login' });
    res.json({ user, token });
  } catch (error) {
    console.error('Mock login error:', error);
    res.status(500).json({ message: 'Mock login failed' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 */
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear JWT cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
