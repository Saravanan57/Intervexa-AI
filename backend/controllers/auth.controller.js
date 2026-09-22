const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail } = require('../services/email.service');
const redis = require('../config/redis');

// Helper to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, college, skills, experience } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Default to candidate role
    const candidateRole = await Role.findOne({ name: 'candidate' });
    if (!candidateRole) {
      return res.status(500).json({ success: false, message: 'Candidate role not configured in system' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: candidateRole._id,
      phone: phone || '',
      college: college || '',
      skills: skills || [],
      experience: experience || 0,
      verificationToken
    });

    // Send verification email
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: email,
      subject: 'Intervexa AI - Verify your email address',
      text: `Welcome to Intervexa AI! Click here to verify: ${verifyUrl}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Welcome to Intervexa AI!</h2>
          <p>Thank you for registering. Please click the button below to verify your email address and get started:</p>
          <a href="${verifyUrl}" style="background-color: #7C3AED; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">Verify Email</a>
          <p style="margin-top: 25px; font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    // Activity log
    await ActivityLog.create({
      user: newUser._id,
      action: 'USER_REGISTER',
      ipAddress: req.ip || '',
      details: `Registered candidate: ${email}`
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Verification email sent.'
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email ? String(email).toLowerCase().trim() : '';
    const user = await User.findOne({ email: cleanEmail }).populate('role');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email address.' });
    }

    const isMatch = await bcrypt.compare(String(password).trim(), user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is suspended' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await ActivityLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      ipAddress: req.ip || '',
      details: 'Logged in successfully'
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        skills: user.skills,
        experience: user.experience
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).populate('role');

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid token user session' });
    }

    const tokens = generateTokens(user);
    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Refresh token expired or invalid' });
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token missing' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = '';
    await user.save();

    await ActivityLog.create({
      user: user._id,
      action: 'USER_VERIFY_EMAIL',
      ipAddress: req.ip || '',
      details: 'Email address verified'
    });

    // Output visual success HTML page if requested via browser redirect
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #0B1120; color: white; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h1 style="color: #22C55E;">Email Verified!</h1>
        <p>Your email has been verified successfully. You can close this window and log in to Intervexa AI.</p>
      </div>
    `);
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const cleanEmail = email ? String(email).toLowerCase().trim() : '';
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) {
      // For security, don't reveal user doesn't exist
      return res.status(200).json({ success: true, message: 'If a matching email exists, reset instructions have been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const frontendBaseUrl = process.env.FRONTEND_URL || req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/auth/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Intervexa AI - Password Reset request',
      text: `Reset your password here: ${resetUrl}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the link below to verify and update your credentials:</p>
          <a href="${resetUrl}" style="background-color: #7C3AED; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px;">Reset Password</a>
          <p style="margin-top: 25px; font-size: 12px; color: #888;">This link will expire in 1 hour. If you did not request this, you can ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: 'Password reset link sent.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;
    await user.save();

    await ActivityLog.create({
      user: user._id,
      action: 'USER_PASSWORD_RESET',
      ipAddress: req.ip || '',
      details: 'Password reset completed'
    });

    res.status(200).json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.token;
    if (token) {
      // Decode to find expiry
      const decoded = jwt.decode(token);
      const remainingSeconds = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
      
      const redisClient = redis.getClient();
      await redisClient.set(`blacklist:${token}`, '1', {
        EX: remainingSeconds || 900 // standard 15m blacklist fallback
      });

      await ActivityLog.create({
        user: req.user._id,
        action: 'USER_LOGOUT',
        ipAddress: req.ip || '',
        details: 'Logged out successfully'
      });
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await ActivityLog.create({
      user: user._id,
      action: 'USER_PASSWORD_CHANGE',
      ipAddress: req.ip || '',
      details: 'Password updated from account dashboard'
    });

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { 
      name, phone, college, skills, experience, 
      education, projects, certificates, 
      linkedIn, gitHub, portfolioWebsite, 
      preferredJobRole, preferredInterviewLanguage 
    } = req.body;

    const user = await User.findById(req.user._id).populate('role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (college !== undefined) user.college = college;
    if (skills !== undefined) user.skills = skills;
    if (experience !== undefined) user.experience = experience;
    if (education !== undefined) user.education = education;
    if (projects !== undefined) user.projects = projects;
    if (certificates !== undefined) user.certificates = certificates;
    if (linkedIn !== undefined) user.linkedIn = linkedIn;
    if (gitHub !== undefined) user.gitHub = gitHub;
    if (portfolioWebsite !== undefined) user.portfolioWebsite = portfolioWebsite;
    if (preferredJobRole !== undefined) user.preferredJobRole = preferredJobRole;
    if (preferredInterviewLanguage !== undefined) user.preferredInterviewLanguage = preferredInterviewLanguage;

    await user.save();

    let badgeEarned = null;
    const isProfileComplete = user.name && user.email && user.phone && user.college && user.skills.length > 0 && user.education.length > 0;
    if (isProfileComplete) {
      const badge = {
        badgeName: 'Profile Completed',
        badgeIcon: '👤',
        description: 'Completed all core details of your candidate profile card!'
      };
      const alreadyAwarded = user.achievements.some(a => a.badgeName === badge.badgeName);
      if (!alreadyAwarded) {
        user.achievements.push(badge);
        await user.save();
        badgeEarned = badge;
      }
    }

    await ActivityLog.create({
      user: user._id,
      action: 'USER_PROFILE_UPDATE',
      ipAddress: req.ip || '',
      details: 'Updated profile information'
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      badgeEarned,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        skills: user.skills,
        experience: user.experience,
        education: user.education,
        projects: user.projects,
        certificates: user.certificates,
        linkedIn: user.linkedIn,
        gitHub: user.gitHub,
        portfolioWebsite: user.portfolioWebsite,
        preferredJobRole: user.preferredJobRole,
        preferredInterviewLanguage: user.preferredInterviewLanguage,
        achievements: user.achievements
      }
    });
  } catch (err) {
    next(err);
  }
};
