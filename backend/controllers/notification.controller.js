const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdDate: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.body;
    
    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, user: req.user._id },
        { isRead: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Notifications updated successfully.'
    });
  } catch (err) {
    next(err);
  }
};
