const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['artisan', 'user'], required: true },
    refreshToken: { type: String },
  });
  
  const UserModel = mongoose.model("Users", UserSchema);

  module.exports = UserModel;