const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require("dotenv");

dotenv.config(); // Load env variables

const authRoutes = require('./Routes/auth/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err.message));

// Routes
app.use('/auth', authRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Hello Artisan API 👋');
});

// Serve React build (optional for production)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/build/index.html'));
// });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});