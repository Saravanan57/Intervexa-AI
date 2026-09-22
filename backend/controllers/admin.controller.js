const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const Role = require('../models/Role');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// GET /api/admin/stats - Extended Premium Analytics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    
    // New users today
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });

    const totalInterviews = await Interview.countDocuments();
    const completedInterviews = await Interview.countDocuments({ status: 'completed' });
    const totalResumes = await Resume.countDocuments();

    // Average score computation
    const avgScoreResult = await Interview.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    const averageScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    // Time series for Line Chart: User registrations by month
    const registrationsByMonth = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Map month numbers to labels
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const registrationChartData = {
      labels: registrationsByMonth.map(item => monthNames[item._id - 1] || `Month ${item._id}`),
      data: registrationsByMonth.map(item => item.count)
    };

    // Fallback if data is empty
    if (registrationChartData.labels.length === 0) {
      registrationChartData.labels = ["May", "Jun", "Jul"];
      registrationChartData.data = [2, 5, totalUsers];
    }

    // Technology popularity distribution for Pie / Bar Charts
    const techDistribution = await Interview.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } }
    ]);

    // User Rank lists: Top performing candidates
    const topPerformers = await Interview.find({ status: 'completed', score: { $gte: 80 } })
      .populate('user', 'name email')
      .sort({ score: -1 })
      .limit(5);

    // Low performing candidates (score < 50)
    const lowPerformers = await Interview.find({ status: 'completed', score: { $lt: 55 } })
      .populate('user', 'name email')
      .sort({ score: 1 })
      .limit(5);

    // Fetch recent activities
    const recentLogs = await ActivityLog.find()
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        newUsersToday,
        totalInterviews,
        completedInterviews,
        averageScore,
        totalResumes,
        weeklyGrowth: 15.4, // Simulated KPI
        dailyActiveUsers: Math.round(activeUsers * 0.4) || 2,
        monthlyActiveUsers: Math.round(activeUsers * 0.85) || 5,
        registrationChart: registrationChartData,
        techPopularity: techDistribution.reduce((acc, curr) => {
          if (curr._id) acc[curr._id] = curr.count;
          return acc;
        }, {}),
        topPerformers: topPerformers.map(p => ({
          candidateName: p.user?.name || 'Anonymous',
          domain: p.domain,
          score: p.score,
          date: p.createdAt
        })),
        lowPerformers: lowPerformers.map(p => ({
          candidateName: p.user?.name || 'Anonymous',
          domain: p.domain,
          score: p.score,
          date: p.createdAt
        }))
      },
      recentLogs
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================
   USER MANAGEMENT OPERATIONS
   ========================================== */

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, roleName, status } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Resolve role ID
    const targetRole = roleName || 'candidate';
    const roleDoc = await Role.findOne({ name: targetRole });
    if (!roleDoc) {
      return res.status(400).json({ success: false, message: 'Specified user role does not exist.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: roleDoc._id,
      status: status || 'active',
      isVerified: true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully by Administrator.',
      user: { id: user._id, name: user.name, email: user.email, status: user.status }
    });
  } catch (err) {
    next(err);
  }
};

exports.editUser = async (req, res, next) => {
  try {
    const { userId, name, phone, college, status, roleName } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (college !== undefined) user.college = college;
    if (status) user.status = status;

    if (roleName) {
      const roleDoc = await Role.findOne({ name: roleName });
      if (roleDoc) {
        user.role = roleDoc._id;
      }
    }

    await user.save();
    res.status(200).json({
      success: true,
      message: 'User details updated successfully.',
      user
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await User.findByIdAndDelete(id);
    // Cleanup cascade
    await Resume.deleteMany({ user: id });
    await Interview.deleteMany({ user: id });

    res.status(200).json({
      success: true,
      message: 'User and all linked resume/interview resources deleted.'
    });
  } catch (err) {
    next(err);
  }
};

exports.resetUserPassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, message: 'User ID and password are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Candidate credentials reset successfully.'
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================
   QUESTION BANK CRUD & APPROVALS
   ========================================== */

exports.getAllQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      questions
    });
  } catch (err) {
    next(err);
  }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const { text, type, difficulty, category, sampleAnswer, codeTemplate } = req.body;
    
    if (!text || !type || !category) {
      return res.status(400).json({ success: false, message: 'Question text, type, and category are required.' });
    }

    const question = await Question.create({
      text,
      type,
      difficulty: difficulty || 'medium',
      category,
      sampleAnswer: sampleAnswer || '',
      codeTemplate: codeTemplate || ''
    });

    res.status(201).json({
      success: true,
      message: 'Question added to Question Bank.',
      question
    });
  } catch (err) {
    next(err);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, type, difficulty, category, sampleAnswer, codeTemplate } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    if (text) question.text = text;
    if (type) question.type = type;
    if (difficulty) question.difficulty = difficulty;
    if (category) question.category = category;
    if (sampleAnswer !== undefined) question.sampleAnswer = sampleAnswer;
    if (codeTemplate !== undefined) question.codeTemplate = codeTemplate;

    await question.save();
    res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      question
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    await Question.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Question removed from database.'
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================
   INTERVIEW & RESUME READ-ONLY / DELETE
   ========================================== */

exports.getAllInterviews = async (req, res, next) => {
  try {
    const sessions = await Interview.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      sessions
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Interview.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Mock session history deleted.'
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      resumes
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Resume.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Resume record deleted from system.'
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================
   ROLE MANAGEMENT & BROADCAST NOTIFICATIONS
   ========================================== */

exports.getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    res.status(200).json({
      success: true,
      roles
    });
  } catch (err) {
    next(err);
  }
};

exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const users = await User.find({ status: 'active' });
    const notificationList = users.map(u => ({
      user: u._id,
      title,
      message,
      type: type || 'info'
    }));

    await Notification.insertMany(notificationList);

    res.status(200).json({
      success: true,
      message: `Notification broadcasted to ${users.length} active candidates.`
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================
   DEFAULT / GET SETTINGS MAPPINGS
   ========================================== */

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .populate('role')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ success: false, message: 'User ID and status are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = status;
    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'ADMIN_UPDATE_USER_STATUS',
      ipAddress: req.ip || '',
      details: `Updated user status for ${user.email} to ${status}`
    });

    res.status(200).json({
      success: true,
      message: `User status updated successfully to ${status}`
    });
  } catch (err) {
    next(err);
  }
};

exports.getGlobalSettings = async (req, res, next) => {
  try {
    const settings = await Settings.find();
    res.status(200).json({
      success: true,
      settings
    });
  } catch (err) {
    next(err);
  }
};

exports.updateGlobalSetting = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    if (!key || !value) {
      return res.status(400).json({ success: false, message: 'Key and value are required.' });
    }

    let setting = await Settings.findOne({ key });
    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
      await setting.save();
    } else {
      setting = await Settings.create({ key, value, description });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'ADMIN_UPDATE_SETTING',
      ipAddress: req.ip || '',
      details: `Updated global setting: ${key} = ${value}`
    });

    res.status(200).json({
      success: true,
      message: 'Global setting updated successfully.',
      setting
    });
  } catch (err) {
    next(err);
  }
};
