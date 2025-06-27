const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const verifyToken = require('../../middleware/verifyToken');
const UserModel = require('../../Models/user');
const ArtisanProfile = require('../../Models/ArtisanProfiles');

const {
  register,
  login,
  refreshAccessToken,
  logout,
  getUserInfo,
  sendPasswordResetCode,
  resetPassword,
} = require('../../controllers/AuthController');

// ============ Normal Auth ============
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', verifyToken, getUserInfo);
router.post('/send-reset-code', sendPasswordResetCode);
router.post('/reset-password', resetPassword);

// ============ Google OAuth ============

// Step 1: Start Google OAuth login
router.get(
  '/google',
  (req, res, next) => {
    req.session = req.session || {};
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

// Step 2: Handle Google Callback
router.get(
  '/google/callback',
  (req, res, next) => {
    console.log('⚡ /google/callback route hit with query:', req.query);
    next();
  },
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login',
  }),
  async (req, res) => {
    console.log("🔐 Passport authentication successful");

    try {
      const user = req.user;
      console.log("👤 Authenticated user:", user.email, "| ID:", user._id);

      const accessToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
      );

      const refreshToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      user.refreshToken = refreshToken;
      await user.save();

      const baseUrl = 'http://localhost:3000'; // adjust for production

      let redirectPath = '/google-success';
      if (user.role === 'artisan' && !user.profileCompleted) {
        redirectPath = '/complete-profile';
      }

      const redirectUrl = `${baseUrl}${redirectPath}?accessToken=${accessToken}&refreshToken=${refreshToken}&role=${user.role}`;
      console.log("🚀 Redirecting to:", redirectUrl);

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Google login error:', error.message);
      res.redirect('http://localhost:3000/login?error=google_login_failed');
    }
  }
);

module.exports = router;
