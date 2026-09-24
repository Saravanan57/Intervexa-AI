const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail } = require('../services/email.service');
const redis = require('../config/redis');
const logger = require('../utils/logger');

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

// Helper to reliably compute trimmed frontend URL with https:// prefix
const getFrontendBaseUrl = (req) => {
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) {
    let url = process.env.FRONTEND_URL.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
  }

  const rawOrigin = req?.headers?.origin || req?.headers?.referer;
  if (rawOrigin && typeof rawOrigin === 'string') {
    try {
      const parsed = new URL(rawOrigin);
      const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      // In production, never return or redirect to localhost
      if (process.env.NODE_ENV !== 'production' || !isLocalhost) {
        return parsed.origin;
      }
    } catch (e) {
      // Ignore URL parsing errors and fallback
    }
  }

  return 'https://intervexa-ai-sooty.vercel.app';
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, college, skills, experience } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const cleanEmail = email ? String(email).toLowerCase().trim() : '';
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
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
      email: cleanEmail,
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

    if (!user.password) {
      const providerName = user.authProvider === 'google' ? 'Google' : (user.authProvider === 'facebook' ? 'Facebook' : 'social login');
      return res.status(400).json({
        success: false,
        message: `This account is registered with ${providerName}. Please use "Continue with ${providerName}" or use "Forgot Password" to set a password.`
      });
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

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Validate basic email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const user = await User.findOne({ email: cleanEmail });
    
    // For security, do not reveal if a user exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email address, password reset instructions have been sent.'
      });
    }

    // Generate secure 32-byte (256-bit) crypto token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Store only the secure SHA-256 hash representation in the database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const frontendBaseUrl = getFrontendBaseUrl(req);
    const resetUrl = `${frontendBaseUrl}/auth/reset-password?token=${resetToken}`;
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Intervexa AI - Password Reset Request',
      text: `Reset your password here: ${resetUrl}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0145F2; margin: 0; font-size: 24px; font-weight: 800;">Intervexa AI</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Master Every Interview with AI</p>
          </div>
          <h2 style="color: #1e293b; font-size: 18px; font-weight: 700;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">We received a request to reset your password for your Intervexa AI account. Click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0145F2; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Or copy and paste this URL into your browser:<br/><a href="${resetUrl}" style="color: #0145F2; word-break: break-all;">${resetUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This reset link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
    });

    if (!emailResult || !emailResult.success) {
      // Invalidate the token so an undelivered token does not remain valid
      user.resetPasswordToken = '';
      user.resetPasswordExpires = null;
      await user.save().catch(() => {});

      console.error(`[AUTH ERROR] Failed to dispatch password reset email to ${user.email}: ${emailResult?.error || 'Unknown error'}`);
      logger.error('Failed to dispatch password reset email to %s: %s', user.email, emailResult?.error || 'Unknown error');
      return res.status(503).json({
        success: false,
        message: 'Unable to send password reset email at this time. Please try again later or contact support.'
      });
    }

    console.log(`[EMAIL SUCCESS] Password reset email sent successfully to ${user.email}`);
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been sent.'
    });
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

    const cleanPassword = String(password).trim();
    if (cleanPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanToken = String(token).trim();
    const hashedToken = crypto.createHash('sha256').update(cleanToken).digest('hex');

    // Query for either hashedToken (new) or raw token (backward compatibility) with valid expiry
    const user = await User.findOne({
      resetPasswordToken: { $in: [hashedToken, cleanToken] },
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(cleanPassword, salt);
    // Invalidate reset token immediately (single-use guarantee)
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;
    user.isVerified = true;
    await user.save();

    await ActivityLog.create({
      user: user._id,
      action: 'USER_PASSWORD_RESET',
      ipAddress: req.ip || '',
      details: 'Password reset completed'
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.'
    });
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

exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.name || 'candidate',
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        skills: user.skills,
        experience: user.experience,
        authProvider: user.authProvider || 'local'
      }
    });
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

/* ==========================================================================
   SOCIAL AUTHENTICATION & ACCOUNT LINKING (GOOGLE & FACEBOOK)
   ========================================================================== */

/**
 * Reusable helper to find, link, or create a social candidate account
 */
const findOrCreateSocialUser = async ({ provider, providerId, email, name, picture, emailVerified }) => {
  const cleanEmail = email ? String(email).toLowerCase().trim() : '';

  // 1. Look up by social provider ID
  let user = null;
  if (provider === 'google') {
    user = await User.findOne({ googleId: providerId }).populate('role');
  } else if (provider === 'facebook') {
    user = await User.findOne({ facebookId: providerId }).populate('role');
  }

  // 2. Safe account linking: Match existing user by verified email if not already linked
  if (!user && cleanEmail) {
    user = await User.findOne({ email: cleanEmail }).populate('role');
    if (user) {
      let updated = false;
      if (provider === 'google' && !user.googleId) {
        user.googleId = providerId;
        updated = true;
      } else if (provider === 'facebook' && !user.facebookId) {
        user.facebookId = providerId;
        updated = true;
      }
      if (!user.profileImage && picture) {
        user.profileImage = picture;
        updated = true;
      }
      if (!user.isVerified && emailVerified) {
        user.isVerified = true;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }
  }

  // 3. New candidate registration if no account exists
  if (!user) {
    if (!cleanEmail) {
      throw new Error(`Your ${provider === 'google' ? 'Google' : 'Facebook'} account did not share a verified email address. Email is required for registration.`);
    }

    const candidateRole = await Role.findOne({ name: 'candidate' });
    if (!candidateRole) {
      throw new Error('Candidate role not configured in system');
    }

    user = await User.create({
      name: name || (provider === 'google' ? 'Google Candidate' : 'Facebook Candidate'),
      email: cleanEmail,
      role: candidateRole._id,
      authProvider: provider,
      googleId: provider === 'google' ? providerId : '',
      facebookId: provider === 'facebook' ? providerId : '',
      profileImage: picture || '',
      isVerified: Boolean(emailVerified),
      status: 'active'
    });

    user = await User.findById(user._id).populate('role');
  }

  return user;
};

// Short-lived memory store for single-use authorization exchange codes
const authExchangeCodes = new Map();

const storeAuthExchangeCode = async (code, data) => {
  const expiresAt = Date.now() + 60000; // 60 seconds TTL
  authExchangeCodes.set(code, { ...data, expiresAt });

  try {
    const redisClient = redis.getClient();
    if (redis.isConnected() && redisClient) {
      await redisClient.set(`auth_exchange:${code}`, JSON.stringify(data), { EX: 60 });
    }
  } catch (e) {
    // Redis optional
  }
};

const consumeAuthExchangeCode = async (code) => {
  if (!code || typeof code !== 'string') return null;

  try {
    const redisClient = redis.getClient();
    if (redis.isConnected() && redisClient) {
      const redisData = await redisClient.get(`auth_exchange:${code}`);
      if (redisData) {
        await redisClient.del(`auth_exchange:${code}`);
        authExchangeCodes.delete(code);
        return JSON.parse(redisData);
      }
    }
  } catch (e) {
    // Fall back to memory
  }

  const memoryData = authExchangeCodes.get(code);
  if (!memoryData) return null;

  authExchangeCodes.delete(code); // single-use deletion

  if (Date.now() > memoryData.expiresAt) {
    return null; // Expired
  }

  return memoryData;
};

// Periodic memory store cleanup
setInterval(() => {
  const now = Date.now();
  for (const [code, val] of authExchangeCodes.entries()) {
    if (now > val.expiresAt) {
      authExchangeCodes.delete(code);
    }
  }
}, 300000).unref();

const getBackendBaseUrl = (req) => {
  if (process.env.BACKEND_URL && process.env.BACKEND_URL.trim()) {
    let url = process.env.BACKEND_URL.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
  }
  const host = req?.get('host');
  const protocol = req?.protocol || 'https';
  if (host) {
    return `${protocol}://${host}`;
  }
  return 'https://intervexa-ai-backend-5w9c.onrender.com';
};

const getGoogleCallbackUrl = (req) => {
  if (process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_CALLBACK_URL.trim()) {
    return process.env.GOOGLE_CALLBACK_URL.trim();
  }
  return `${getBackendBaseUrl(req)}/api/auth/google/callback`;
};

const getFacebookCallbackUrl = (req) => {
  if (process.env.FACEBOOK_CALLBACK_URL && process.env.FACEBOOK_CALLBACK_URL.trim()) {
    return process.env.FACEBOOK_CALLBACK_URL.trim();
  }
  return `${getBackendBaseUrl(req)}/api/auth/facebook/callback`;
};

// ---------------- Google OAuth ----------------

exports.getGoogleAuthUrl = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({
      success: false,
      message: 'Google authentication is currently being configured on the server.'
    });
  }

  const redirectUri = getGoogleCallbackUrl(req);
  const state = crypto.randomBytes(16).toString('hex');

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent('openid email profile')}&` +
    `state=${state}&` +
    `access_type=online&` +
    `prompt=select_account`;

  return res.status(200).json({ success: true, url: googleAuthUrl });
};

exports.googleOAuthRedirect = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const frontendBaseUrl = getFrontendBaseUrl(req);

  if (!clientId) {
    return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('Google authentication is currently being configured on the server. Please sign in with email and password.')}`);
  }

  const redirectUri = getGoogleCallbackUrl(req);
  const state = crypto.randomBytes(16).toString('hex');

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent('openid email profile')}&` +
    `state=${state}&` +
    `access_type=online&` +
    `prompt=select_account`;

  res.redirect(googleAuthUrl);
};

exports.googleOAuthCallback = async (req, res) => {
  const frontendBaseUrl = getFrontendBaseUrl(req);
  const { code, error } = req.query;

  if (error || !code) {
    const errorMsg = error === 'access_denied' ? 'Google sign-in was cancelled.' : 'Unable to sign in with Google. Please try again.';
    return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent(errorMsg)}`);
  }

  try {
    const redirectUri = getGoogleCallbackUrl(req);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      logger.error('Google token exchange failed: %s', tokenData.error_description || tokenData.error || 'Unknown error');
      return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('Unable to authenticate with Google. Please try again.')}`);
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.sub) {
      logger.error('Failed to retrieve Google profile: %j', profile);
      return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('Unable to retrieve your Google profile.')}`);
    }

    const user = await findOrCreateSocialUser({
      provider: 'google',
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      emailVerified: profile.email_verified
    });

    if (user.status !== 'active') {
      return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('Your account is currently suspended.')}`);
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await ActivityLog.create({
      user: user._id,
      action: 'USER_LOGIN_GOOGLE',
      ipAddress: req.ip || '',
      details: 'Logged in via Google OAuth'
    });

    // Generate single-use, 60s temporary authorization code to securely transfer session without exposing tokens in URL
    const authCode = crypto.randomBytes(32).toString('hex');
    await storeAuthExchangeCode(authCode, {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.name || user.role || 'candidate',
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        skills: user.skills,
        experience: user.experience
      }
    });

    res.redirect(`${frontendBaseUrl}/auth/callback?code=${encodeURIComponent(authCode)}`);
  } catch (err) {
    logger.error('Google OAuth callback error: %s', err.message);
    res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('An error occurred during Google sign-in. Please try again.')}`);
  }
};

exports.exchangeAuthCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    const payload = await consumeAuthExchangeCode(code.trim());

    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired authorization code. Please sign in again.'
      });
    }

    return res.status(200).json({
      success: true,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: payload.user
    });
  } catch (err) {
    next(err);
  }
};

exports.googleTokenLogin = async (req, res, next) => {
  try {
    const { token, idToken } = req.body;
    const credential = token || idToken;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const payload = await verifyRes.json();

    if (!verifyRes.ok || !payload.sub) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Google token' });
    }

    if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ success: false, message: 'Google token audience mismatch' });
    }

    const user = await findOrCreateSocialUser({
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified === 'true' || payload.email_verified === true
    });

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is suspended' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await ActivityLog.create({
      user: user._id,
      action: 'USER_LOGIN_GOOGLE',
      ipAddress: req.ip || '',
      details: 'Logged in via Google Token'
    });

    res.status(200).json({
      success: true,
      message: 'Google login successful',
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

// ---------------- Facebook OAuth ----------------

exports.getFacebookAuthUrl = (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return res.status(503).json({
      success: false,
      message: 'Facebook authentication is currently being configured on the server.'
    });
  }

  const redirectUri = getFacebookCallbackUrl(req);
  const state = crypto.randomBytes(16).toString('hex');

  const fbAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
    `client_id=${encodeURIComponent(appId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}&` +
    `scope=${encodeURIComponent('email,public_profile')}&` +
    `response_type=code`;

  return res.status(200).json({ success: true, url: fbAuthUrl });
};

exports.facebookOAuthRedirect = (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const frontendBaseUrl = getFrontendBaseUrl(req);

  if (!appId) {
    return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('Facebook authentication is currently being configured on the server. Please sign in with email and password.')}`);
  }

  const redirectUri = getFacebookCallbackUrl(req);
  const state = crypto.randomBytes(16).toString('hex');

  const fbAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
    `client_id=${encodeURIComponent(appId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}&` +
    `scope=${encodeURIComponent('email,public_profile')}&` +
    `response_type=code`;

  res.redirect(fbAuthUrl);
};

exports.facebookOAuthCallback = async (req, res) => {
  const frontendBaseUrl = getFrontendBaseUrl(req);
  const { code, error, error_reason } = req.query;

  if (error || !code) {
    const errorMsg = (error === 'access_denied' || error_reason === 'user_denied')
      ? 'Facebook sign-in was cancelled.' 
      : 'Unable to sign in with Facebook. Please try again.';
    return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent(errorMsg)}`);
  }

  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    logger.error('Facebook OAuth callback called but FACEBOOK_APP_ID or FACEBOOK_APP_SECRET is not configured');
    return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('Facebook authentication is currently being configured on the server.')}`);
  }

  try {
    const redirectUri = getFacebookCallbackUrl(req);

    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${encodeURIComponent(process.env.FACEBOOK_APP_ID)}&` +
      `client_secret=${encodeURIComponent(process.env.FACEBOOK_APP_SECRET)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${encodeURIComponent(code)}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      logger.error('Facebook token exchange failed: %j', tokenData);
      return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('Unable to authenticate with Facebook. Please try again.')}`);
    }

    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(tokenData.access_token)}`;
    const profileRes = await fetch(profileUrl);
    const profile = await profileRes.json();

    if (!profileRes.ok || !profile.id) {
      logger.error('Failed to retrieve Facebook profile: %j', profile);
      return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('Unable to retrieve your Facebook profile.')}`);
    }

    const picture = profile.picture?.data?.url || '';

    const user = await findOrCreateSocialUser({
      provider: 'facebook',
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      picture,
      emailVerified: Boolean(profile.email)
    });

    if (user.status !== 'active') {
      return res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent('Your account is currently suspended.')}`);
    }

    const { accessToken, refreshToken } = generateTokens(user);

    await ActivityLog.create({
      user: user._id,
      action: 'USER_LOGIN_FACEBOOK',
      ipAddress: req.ip || '',
      details: 'Logged in via Facebook OAuth'
    });

    // Generate single-use, 60s temporary authorization code to securely transfer session without exposing tokens in URL
    const authCode = crypto.randomBytes(32).toString('hex');
    await storeAuthExchangeCode(authCode, {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.name || user.role || 'candidate',
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        skills: user.skills,
        experience: user.experience
      }
    });

    res.redirect(`${frontendBaseUrl}/auth/callback?code=${encodeURIComponent(authCode)}`);
  } catch (err) {
    logger.error('Facebook OAuth callback error: %s', err.message);
    const clientMsg = (err.message && err.message.includes('verified email address'))
      ? err.message
      : 'An error occurred during Facebook sign-in. Please try again.';
    res.redirect(`${frontendBaseUrl}/auth/login?error=${encodeURIComponent(clientMsg)}`);
  }
};

exports.facebookTokenLogin = async (req, res, next) => {
  try {
    const { accessToken, userID } = req.body;
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Facebook access token is required' });
    }

    const profileUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`;
    const profileRes = await fetch(profileUrl);
    const profile = await profileRes.json();

    if (!profileRes.ok || !profile.id) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Facebook access token' });
    }

    if (userID && profile.id !== userID) {
      return res.status(401).json({ success: false, message: 'Facebook user ID mismatch' });
    }

    const picture = profile.picture?.data?.url || '';

    const user = await findOrCreateSocialUser({
      provider: 'facebook',
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      picture,
      emailVerified: Boolean(profile.email)
    });

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is suspended' });
    }

    const { accessToken: appAccessToken, refreshToken } = generateTokens(user);

    await ActivityLog.create({
      user: user._id,
      action: 'USER_LOGIN_FACEBOOK',
      ipAddress: req.ip || '',
      details: 'Logged in via Facebook Token'
    });

    res.status(200).json({
      success: true,
      message: 'Facebook login successful',
      accessToken: appAccessToken,
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

/**
 * Meta / Facebook User Data Deletion Callback
 * Required by Meta App Review & GDPR/data privacy guidelines.
 *
 * Receives signed_request from Meta when a user removes the app and requests data deletion.
 * Validates HMAC-SHA256 signature using FACEBOOK_APP_SECRET, extracts Facebook user_id,
 * locates the matching user, creates a unique confirmation tracking code,
 * and responds with status URL and confirmation code per Meta specification.
 */
exports.facebookDataDeletionCallback = async (req, res, next) => {
  try {
    const signedRequest = req.body?.signed_request;

    if (!signedRequest || typeof signedRequest !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid signed_request parameter'
      });
    }

    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appSecret) {
      logger.error('Meta Data Deletion Callback called but FACEBOOK_APP_SECRET is not configured');
      return res.status(503).json({
        success: false,
        message: 'Facebook data deletion service is currently unavailable.'
      });
    }

    const parts = signedRequest.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signed_request format. Expected <signature>.<payload>'
      });
    }

    const [encodedSig, encodedPayload] = parts;

    // Helper to safely decode base64url strings into Buffer
    const decodeBase64Url = (input) => {
      let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      return Buffer.from(base64, 'base64');
    };

    let sigBuffer;
    try {
      sigBuffer = decodeBase64Url(encodedSig);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Malformed signature encoding in signed_request'
      });
    }

    const expectedSig = crypto
      .createHmac('sha256', appSecret)
      .update(encodedPayload)
      .digest();

    if (sigBuffer.length !== expectedSig.length || !crypto.timingSafeEqual(sigBuffer, expectedSig)) {
      logger.warn('Meta signed_request signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature in signed_request'
      });
    }

    let payload;
    try {
      const decodedJson = decodeBase64Url(encodedPayload).toString('utf8');
      payload = JSON.parse(decodedJson);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Malformed payload in signed_request'
      });
    }

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload data structure'
      });
    }

    if (payload.algorithm && payload.algorithm.toUpperCase() !== 'HMAC-SHA256') {
      return res.status(400).json({
        success: false,
        message: `Unsupported algorithm: ${payload.algorithm}. HMAC-SHA256 is required.`
      });
    }

    const userId = payload.user_id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing user_id in signed_request payload'
      });
    }

    // Lookup user by Facebook ID
    const user = await User.findOne({ facebookId: userId });
    logger.info('Meta User Data Deletion callback verified for Facebook user ID: %s (matched user: %s)', userId, user ? user._id : 'not_found');

    // Generate unique deletion confirmation code for tracking
    const confirmationCode = crypto.randomBytes(16).toString('hex');

    // Log request if user exists for compliance auditing
    if (user) {
      try {
        await ActivityLog.create({
          user: user._id,
          action: 'DATA_DELETION_REQUESTED',
          ipAddress: req.ip || '',
          details: `Meta data deletion requested with confirmation code ${confirmationCode}`
        });
      } catch (logErr) {
        logger.error('Failed to log data deletion request activity: %s', logErr.message);
      }
    }

    // NOTE: In compliance with data retention policies, the deletion acknowledgment
    // is confirmed to Meta immediately. If automated scheduled purging is required,
    // queue a background job here to purge/anonymize user profile, resumes, and interview records.
    const frontendBaseUrl = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim())
      ? process.env.FRONTEND_URL.trim().replace(/\/+$/, '')
      : 'https://intervexa-ai-sooty.vercel.app';

    const statusUrl = `${frontendBaseUrl}/data-deletion-status?code=${confirmationCode}`;

    return res.status(200).json({
      url: statusUrl,
      confirmation_code: confirmationCode
    });
  } catch (err) {
    logger.error('Meta Data Deletion Callback error: %s', err.message);
    next(err);
  }
};

