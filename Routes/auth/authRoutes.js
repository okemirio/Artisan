const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const verifyToken = require('../../middleware/verifyToken');
const UserModel = require('../../Models/user');

const {
  register,
  login,
  refreshAccessToken,
  logout,
  getUserInfo,
  sendPasswordResetCode,
  resetPassword,
} = require('../../controllers/AuthController');

// ============
// Normal Auth
// ============
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', verifyToken, getUserInfo);
router.post('/send-reset-code', sendPasswordResetCode);
router.post('/reset-password', resetPassword);

// =======================
// Google OAuth Routes
// =======================

// Step 1: Start Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Handle Google callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate tokens like regular login
      const accessToken = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
      );

      const refreshToken = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      // Save refresh token to DB
      user.refreshToken = refreshToken;
      await user.save();

      // Redirect to frontend with tokens
      const redirectUrl = `http://localhost:3000/google-success?accessToken=${accessToken}&refreshToken=${refreshToken}&role=${user.role}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google login error:', error.message);
      res.redirect('http://localhost:3000/login?error=google_login_failed');
    }
  }
);

module.exports = router;
