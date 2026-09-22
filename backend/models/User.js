const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  fieldOfStudy: { type: String, default: '' },
  startYear: { type: Number },
  endYear: { type: Number }
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  technologies: { type: [String], default: [] },
  link: { type: String, default: '' }
});

const CertificateSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuingOrg: { type: String, default: '' },
  issueDate: { type: Date },
  link: { type: String, default: '' }
});

const AchievementSchema = new mongoose.Schema({
  badgeName: { type: String, required: true },
  badgeIcon: { type: String, required: true }, // Emoji or icon code
  description: { type: String, required: true },
  awardedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  college: {
    type: String,
    default: ''
  },
  degree: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: Number,
    default: 0
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: ''
  },
  resetPasswordToken: {
    type: String,
    default: ''
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  
  // Profile & Gamification Fields
  education: { type: [EducationSchema], default: [] },
  projects: { type: [ProjectSchema], default: [] },
  certificates: { type: [CertificateSchema], default: [] },
  linkedIn: { type: String, default: '' },
  gitHub: { type: String, default: '' },
  portfolioWebsite: { type: String, default: '' },
  
  // Naming check overrides
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  portfolio: { type: String, default: '' },

  preferredJobRole: { type: String, default: '' },
  preferredInterviewLanguage: { type: String, default: 'English' },
  achievements: { type: [AchievementSchema], default: [] }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});

UserSchema.index({ status: 1, createdAt: -1 });
UserSchema.index({ email: 1, status: 1 });

module.exports = mongoose.model('User', UserSchema);
