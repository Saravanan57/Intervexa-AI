const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  question: {
    type: String
  },
  type: {
    type: String,
    required: true,
    enum: ['Voice', 'Technical', 'HR', 'Behavioral', 'Coding']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true,
    default: 'General'
  },
  technology: {
    type: String,
    default: 'General'
  },
  sampleAnswer: {
    type: String,
    default: ''
  },
  expectedAnswer: {
    type: String,
    default: ''
  },
  codeTemplate: {
    type: String,
    default: ''
  },
  keywords: {
    type: [String],
    default: []
  },
  testCases: [
    {
      input: String,
      output: String,
      isHidden: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
