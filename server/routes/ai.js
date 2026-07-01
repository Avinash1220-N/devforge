const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// Multer upload boundaries (5MB maximum size)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single('resume');
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Upload failed: Resume size exceeds 5MB limit.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(550).json({ success: false, message: err.message });
    }
    next();
  });
};

// V2.1 AI Service Routes
router.post('/parse-resume', auth, handleUpload, aiController.parseResume);
router.post('/generate-portfolio', auth, aiController.generatePortfolio);
router.post('/project-summary', auth, aiController.projectSummary);
router.post('/career-fit', auth, aiController.careerFit);
router.post('/rewrite', auth, aiController.rewrite);
router.post('/ats-score', auth, aiController.atsScore);
router.post('/portfolio-score', auth, aiController.portfolioScore);

// Advanced AI V2.1 features
router.post('/star-bullets', auth, aiController.generateStarBullets);
router.post('/project-ai', auth, aiController.generateProjectAI);

// Notifications endpoints
router.get('/notifications', auth, aiController.getNotifications);
router.get('/notifications/unread-count', auth, aiController.getUnreadNotificationsCount);
router.post('/notifications/:id/read', auth, aiController.readNotification);
router.post('/notifications/read-all', auth, aiController.readAllNotifications);

module.exports = router;
