const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Social authentication routes
router.get('/google', authController.googleOAuthRedirect);
router.get('/google/url', authController.getGoogleAuthUrl);
router.get('/google/callback', authController.googleOAuthCallback);
router.post('/google', authController.googleTokenLogin);

router.get('/facebook', authController.facebookOAuthRedirect);
router.get('/facebook/url', authController.getFacebookAuthUrl);
router.get('/facebook/callback', authController.facebookOAuthCallback);
router.post('/facebook', authController.facebookTokenLogin);
router.post('/facebook/data-deletion', authController.facebookDataDeletionCallback);

router.post('/exchange-code', authController.exchangeAuthCode);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.post('/change-password', protect, authController.changePassword);
router.put('/profile', protect, authController.updateProfile);

module.exports = router;
