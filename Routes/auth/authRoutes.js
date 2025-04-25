const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const UserModel = require('../../Models/user');

const {
  register,
  login,
  refreshAccessToken,
  logout,
} = require('../../controllers/AuthController');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);

router.post('/logout', logout);

module.exports = router;