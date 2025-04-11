const express = require('express');
const routes =express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const UserModel = require('../../Models/user.js');
const { Regis, Log} = require('../../controllers/Login_controller.js');




// Authentication middleware

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
  
    next();
  });
};

module.exports = authenticateToken;


  // Define user schema and model


routes.post('/register', Regis)
  
  // Login route
routes.post('/', Log)

  // Get user information route
routes.get('/userinfo', authenticateToken, getUserInfo);
routes.post('/refresh-token', refreshAccessToken);
routes.post('/send-reset-code', sendPasswordResetCode);
routes.post('/reset-password', resetPassword);

  module.exports = routes;