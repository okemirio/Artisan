const mongoose = require('mongoose');
const UserModel = require('../Models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


// Register a new user
const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!['artisan', 'user'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
console.log(accessToken)
    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, role: user.role, expiresIn: 1800 });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Refresh Token
const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token required.' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await UserModel.findOne({ _id: decoded.userId, refreshToken });
    if (!user) return res.status(403).json({ message: 'Invalid refresh token.' });

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    res.json({ accessToken, expiresIn: 1800 });
  } catch (err) {
    res.status(401).json({ message: 'Token expired or invalid.' });
  }
};

// Logout
const logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const user = await UserModel.findOneAndUpdate(
      { refreshToken },
      { refreshToken: '' }
    );

    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout Error:', err.message);
    res.status(500).json({ message: 'Error during logout.' });
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
};
