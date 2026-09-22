const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.post('/analyze', protect, upload.single('resume'), resumeController.uploadAndAnalyze);
router.post('/upload', protect, upload.single('resume'), resumeController.uploadAndAnalyze);
router.get('/history', protect, resumeController.getResumeHistory);
router.get('/:id', protect, resumeController.getResumeById);
router.delete('/:id', protect, resumeController.deleteResumeById);

module.exports = router;
