const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  // Legacy support alias
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  technicalScore: {
    type: Number,
    default: 0
  },
  communicationScore: {
    type: Number,
    default: 0
  },
  grammarScore: {
    type: Number,
    default: 0
  },
  confidenceScore: {
    type: Number,
    default: 0
  },
  problemSolvingScore: {
    type: Number,
    default: 0
  },
  leadershipScore: {
    type: Number,
    default: 0
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  recommendations: {
    type: [String],
    default: []
  },
  // Legacy aliases
  positivePoints: {
    type: [String],
    default: []
  },
  negativePoints: {
    type: [String],
    default: []
  },
  improvementTips: {
    type: [String],
    default: []
  },
  learningResources: {
    type: [String],
    default: []
  },
  careerSuggestions: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
