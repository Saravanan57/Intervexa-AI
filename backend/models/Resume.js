const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  text: { type: String, default: '' },
  suggestion: { type: String, default: '' }
});

const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  originalFile: {
    type: String,
    default: ''
  },
  parsedText: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  atsScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: Number,
    default: 0
  },
  education: {
    type: [String],
    default: []
  },
  projects: {
    type: [String],
    default: []
  },
  certifications: {
    type: [String],
    default: []
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
  careerSuggestions: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'parsed', 'failed'],
    default: 'pending'
  },

  // ATS metrics & Jobscan comparison
  jobDescription: { type: String, default: '' },
  summary: { type: String, default: '' },
  overallRecommendation: { type: String, default: '' },
  keywordMatch: { type: [String], default: [] },
  missingSkills: { type: [String], default: [] },
  sectionFeedback: {
    summary: { type: String, default: '' },
    experience: { type: String, default: '' },
    skills: { type: String, default: '' },
    education: { type: String, default: '' }
  },
  grammarIssues: { type: [IssueSchema], default: [] },
  formattingIssues: { type: [IssueSchema], default: [] },
  keywordSuggestions: { type: [String], default: [] },
  jobReadinessPercentage: { type: Number, min: 0, max: 100, default: 0 },
  suggestedCertifications: { type: [String], default: [] },
  suggestedCourses: { type: [String], default: [] },
  recommendedProjects: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
