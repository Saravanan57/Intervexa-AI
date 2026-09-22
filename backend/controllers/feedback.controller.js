const Feedback = require('../models/Feedback');
const Interview = require('../models/Interview');

exports.getFeedbackById = async (req, res, next) => {
  try {
    // Check if feedback is queried by feedback ID or linked interview ID
    let feedback = await Feedback.findOne({ interviewId: req.params.id })
      .populate({
        path: 'interviewId',
        populate: { path: 'user', select: 'name email' }
      });

    if (!feedback) {
      feedback = await Feedback.findById(req.params.id)
        .populate({
          path: 'interviewId',
          populate: { path: 'user', select: 'name email' }
        });
    }

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback report not found.' });
    }

    res.status(200).json({
      success: true,
      feedback
    });
  } catch (err) {
    next(err);
  }
};

exports.getFeedbackHistory = async (req, res, next) => {
  try {
    // Find all interviews for the candidate
    const interviews = await Interview.find({ user: req.user._id });
    const interviewIds = interviews.map(i => i._id);

    // Retrieve feedback matching these interviews
    const feedbackList = await Feedback.find({ interviewId: { $in: interviewIds } })
      .populate('interviewId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      feedbackHistory: feedbackList
    });
  } catch (err) {
    next(err);
  }
};
