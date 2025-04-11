const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./Models/user');

const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 
// Enable CORS for cross-origin requests
const corsOptions = {
    origin: ["http://localhost:3000"], // Allow both local and deployed frontend
    credentials: true,
  };
  
  app.use(cors(corsOptions));app.use(express.json());

const mongoURl = process.env.MONGO_URL;
console.log(mongoURl);

mongoose
  .connect(mongoURl)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

// Test Route
app.get('/', (req, res) => {
  res.send('Hello Artisan API 👋');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
