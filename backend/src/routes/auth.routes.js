const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth, isPIC } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);

// PIC only routes - allow PICs to register new users
router.post('/register-user', auth, isPIC, authController.register);

module.exports = router; 