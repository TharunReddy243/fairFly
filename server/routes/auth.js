const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Signup endpoint
router.post('/signup', authController.signupUser); // Becomes POST /api/auth/signup

// Login endpoint
router.post('/login', authController.loginUser); // Becomes POST /api/auth/login

module.exports = router;