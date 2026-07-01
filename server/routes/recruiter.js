const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const recruiterController = require('../controllers/recruiterController');

// V2.1 Recruiter Routes
router.post('/link', auth, recruiterController.generateLink);
router.get('/access/:token', recruiterController.accessPortfolio);
router.post('/access/:token', recruiterController.accessPortfolio);

module.exports = router;
