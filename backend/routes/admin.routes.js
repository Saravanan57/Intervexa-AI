const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('admin'));

// Stats & Overview
router.get('/stats', adminController.getDashboardStats);
router.get('/dashboard', adminController.getDashboardStats);
router.get('/reports', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.post('/users/edit', adminController.editUser);
router.post('/users/status', adminController.updateUserStatus);
router.post('/users/reset-password', adminController.resetUserPassword);
router.delete('/users/:id', adminController.deleteUser);

// Target Checklist specifications
router.put('/block-user', adminController.updateUserStatus);
router.delete('/delete-user/:id', adminController.deleteUser);
router.delete('/delete-user', adminController.deleteUser);

// Question Bank CRUD & Targets
router.get('/questions', adminController.getAllQuestions);
router.post('/questions', adminController.createQuestion);
router.post('/question', adminController.createQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.put('/question/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);
router.delete('/question/:id', adminController.deleteQuestion);

// Interview History CRUD
router.get('/interviews', adminController.getAllInterviews);
router.delete('/interviews/:id', adminController.deleteInterview);

// Resumes CRUD
router.get('/resumes', adminController.getAllResumes);
router.delete('/resumes/:id', adminController.deleteResume);

// Role Configs
router.get('/roles', adminController.getAllRoles);

// Broadcasting Alerts
router.post('/notifications/broadcast', adminController.broadcastNotification);

// Global settings
router.get('/settings', adminController.getGlobalSettings);
router.post('/settings', adminController.updateGlobalSetting);

module.exports = router;
