const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const UserModel = require('../../Models/user');
const verifyToken = require('../../middleware/verifyToken');

const {
  register,
  login,
  refreshAccessToken,
  logout,
  getUserInfo,
  sendPasswordResetCode,
  resetPassword
} = require('../../controllers/AuthController');



router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.get('/me', verifyToken, getUserInfo);
router.post('/send-reset-code', sendPasswordResetCode);
router.post('/reset-password', resetPassword)
router.post('/logout', logout);

module.exports = router;