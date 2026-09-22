const mongoose = require('mongoose');

const InterviewQuestionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  codeTemplate: String,
  sampleAnswer: String,
  category: String
});

const InterviewAnswerSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  responseText: {
    type: String,
    default: ''
  },
  codeSubmitted: {
    type: String,
    default: ''
  },
  audioUrl: {
    type: String,
    default: ''
  },
  feedbackScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  feedbackContent: {
    type: String,
    default: ''
  }
});

const InterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: ['Voice', 'Technical', 'HR', 'Behavioral', 'Coding', 'System Design', 'Resume Based']
  },
  category: {
    type: String,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  questions: [InterviewQuestionSchema],
  answers: [InterviewAnswerSchema],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  voiceTranscript: {
    type: String,
    default: ''
  },
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    default: null
  },

  // Mock configurations
  domain: { type: String, default: 'General' },
  technology: { type: String, default: 'General' },
  difficulty: { type: String, default: 'medium', enum: ['easy', 'medium', 'hard'] },
  durationLimit: { type: Number, default: 20 }, // in minutes
  predictedScore: { type: Number, default: 0 }
}, { timestamps: true });

InterviewSchema.index({ user: 1, status: 1, createdAt: -1 });
InterviewSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('Interview', InterviewSchema);
