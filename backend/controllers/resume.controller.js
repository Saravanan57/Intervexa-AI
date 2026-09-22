const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Resume = require('../models/Resume');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const aiService = require('../services/ai.service');
const logger = require('../utils/logger');

exports.uploadAndAnalyze = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const fileBuffer = req.file.buffer || (req.file.path && fs.existsSync(req.file.path) ? fs.readFileSync(req.file.path) : null);
    const fileType = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    try {
      if (fileType === '.pdf') {
        const dataBuffer = fileBuffer || (req.file.path ? fs.readFileSync(req.file.path) : null);
        if (!dataBuffer) throw new Error('File buffer unavailable');
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text;
      } else if (fileType === '.docx' || fileType === '.doc') {
        if (req.file.buffer) {
          const docResult = await mammoth.extractRawText({ buffer: req.file.buffer });
          extractedText = docResult.value;
        } else if (req.file.path) {
          const docResult = await mammoth.extractRawText({ path: req.file.path });
          extractedText = docResult.value;
        }
      }
    } catch (err) {
      logger.error('File text extraction failed: %s', err.message);
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: 'Failed to extract text from file.' });
    }

    if (!extractedText.trim()) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Uploaded file contains no readable text.' });
    }

    const jobDescription = req.body.jobDescription || '';
    let analysisResult;
    try {
      analysisResult = await aiService.analyzeResume(extractedText, jobDescription);
    } catch (err) {
      logger.error('AI Resume parsing failed: %s', err.message);
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: 'AI Analysis failed.' });
    }

    const resume = await Resume.create({
      user: req.user._id,
      fileName: req.file.originalname,
      filePath: req.file.filename || req.file.originalname,
      fileType: fileType,
      parsedText: extractedText,
      jobDescription: jobDescription,
      score: analysisResult.score || 0,
      skills: analysisResult.skills || [],
      strengths: analysisResult.strengths || [],
      weaknesses: analysisResult.weaknesses || [],
      careerSuggestions: analysisResult.careerSuggestions || [],
      status: 'parsed',
      
      // Jobscan ATS Fields saved in DB
      summary: analysisResult.summary || '',
      overallRecommendation: analysisResult.overallRecommendation || '',
      keywordMatch: analysisResult.keywordMatch || [],
      missingSkills: analysisResult.missingSkills || [],
      sectionFeedback: analysisResult.sectionFeedback || {},
      grammarIssues: analysisResult.grammarIssues || [],
      formattingIssues: analysisResult.formattingIssues || [],
      keywordSuggestions: analysisResult.keywordSuggestions || [],
      jobReadinessPercentage: analysisResult.jobReadinessPercentage || 0,
      suggestedCertifications: analysisResult.suggestedCertifications || [],
      suggestedCourses: analysisResult.suggestedCourses || [],
      recommendedProjects: analysisResult.recommendedProjects || []
    });

    const user = await User.findById(req.user._id);
    user.resume = resume._id;
    if (analysisResult.skills && analysisResult.skills.length > 0) {
      const mergedSkills = Array.from(new Set([...user.skills, ...analysisResult.skills]));
      user.skills = mergedSkills;
    }
    await user.save();

    // Trigger achievement badge checking for first resume analysis
    let badgeEarned = null;
    const resumesCount = await Resume.countDocuments({ user: req.user._id });
    if (resumesCount === 1) {
      const firstBadge = {
        badgeName: 'Resume Uploaded',
        badgeIcon: '📝',
        description: 'Uploaded and analyzed your first resume successfully!'
      };
      // Prevent duplicates
      const hasBadge = user.achievements.some(a => a.badgeName === firstBadge.badgeName);
      if (!hasBadge) {
        user.achievements.push(firstBadge);
        await user.save();
        badgeEarned = firstBadge;
      }
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'RESUME_UPLOAD',
      ipAddress: req.ip || '',
      details: `Uploaded and analyzed resume: ${req.file.originalname}. Match score: ${analysisResult.score}%`
    });

    res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully.',
      badgeEarned,
      resume
    });
  } catch (err) {
    next(err);
  }
};

exports.getResumeHistory = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      resumes
    });
  } catch (err) {
    next(err);
  }
};

exports.getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    res.status(200).json({
      success: true,
      resume
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    
    const user = await User.findById(req.user._id);
    if (user.resume && user.resume.toString() === req.params.id) {
      user.resume = null;
      user.resumeId = null;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Resume audit record deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
