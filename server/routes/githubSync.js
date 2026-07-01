const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const githubSyncController = require('../controllers/githubSyncController');

// V2.1 GitHub Sync Routes
router.post('/scan', auth, githubSyncController.scanRepos);
router.get('/suggestions', auth, githubSyncController.getSuggestions);
router.post('/suggestions/:id/approve', auth, githubSyncController.approveSuggestion);
router.post('/suggestions/:id/reject', auth, githubSyncController.rejectSuggestion);

module.exports = router;
