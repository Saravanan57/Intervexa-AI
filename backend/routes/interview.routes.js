const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');
const { protect } = require('../middlewares/auth');

// Legacy Aliases
router.post('/session', protect, interviewController.createSession);
router.post('/submit-answer', protect, interviewController.submitAnswer);

// Target REST Specifications
router.post('/start', protect, interviewController.createSession);
router.post('/answer', protect, interviewController.submitAnswer);
router.post('/finish', protect, interviewController.finishSession);
router.get('/history', protect, interviewController.getHistory);
router.get('/:id', protect, interviewController.getInterviewDetails);
router.get('/:id/download', protect, interviewController.downloadReportHtml);
router.delete('/:id', protect, interviewController.deleteInterviewSession);

module.exports = router;
