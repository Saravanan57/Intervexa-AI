const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth');

router.get('/', protect, notificationController.getNotifications);
router.post('/read', protect, notificationController.markAsRead);

module.exports = router;
