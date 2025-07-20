const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Signup endpoint
router.post('/signup', authController.signupUser);

// Login endpoint
router.post('/login', authController.loginUser);

module.exports = router;