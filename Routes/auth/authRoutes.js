const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const UserModel = require('../../Models/user');
const verifyToken = require('../../middleware/verifyToken');

// Auth controller functions
const {
  register,
  login,
  refreshAccessToken,
  logout,
  getUserInfo,
  sendPasswordResetCode,
  resetPassword,
} = require('../../controllers/AuthController');

// ====================
// Existing Auth Routes
// ====================
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.get('/me', verifyToken, getUserInfo);
router.post('/send-reset-code', sendPasswordResetCode);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

// ====================
// Google OAuth Routes
// ====================

// Step 1: Redirect to Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Step 2: Handle callback from Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user;

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Redirect to frontend with token in URL
    res.redirect(`http://localhost:3000/google-success?token=${token}`);
  }
);

module.exports = router;