const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Null for unauthenticated log actions (e.g. failed login attempts)
  },
  action: {
    type: String,
    required: true // e.g. 'LOGIN_SUCCESS', 'RESUME_UPLOADED', 'INTERVIEW_COMPLETED'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  }
}, { 
  timestamps: { createdAt: 'timestamp', updatedAt: false } 
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
