const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { protect } = require('../middlewares/auth');

router.get('/history', protect, feedbackController.getFeedbackHistory);
router.get('/:id', protect, feedbackController.getFeedbackById);

module.exports = router;
