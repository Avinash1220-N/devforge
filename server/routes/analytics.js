const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// V2.1 Analytics Routes
router.post('/ping', analyticsController.ping);
router.get('/metrics', auth, analyticsController.getMetrics);

module.exports = router;
