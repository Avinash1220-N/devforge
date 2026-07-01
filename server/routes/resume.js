const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const resumeController = require('../controllers/resumeController');

// Multer setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single('resume');
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Upload failed: Resume size exceeds 5MB limit.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post('/upload', auth, handleUpload, resumeController.uploadResume);
router.get('/history', auth, resumeController.getHistory);
router.get('/download/:id', auth, resumeController.downloadResume);
router.post('/:id/sync-portfolio', auth, resumeController.syncPortfolio);
router.post('/:id/ats-score', auth, resumeController.checkAts);

module.exports = router;
