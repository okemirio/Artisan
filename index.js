const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

dotenv.config();

// Ensure uploads/artisans folder exists before starting app
const uploadDir = path.join(__dirname, 'uploads/artisans');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created upload directory:', uploadDir);
}

const authRoutes = require('./Routes/auth/authRoutes');
const artisanRoutes = require('./Routes/artisanRoutes');

const app = express();

// CORS configuration — consider allowing your production frontend domain as well
app.use(cors({   origin: ['http://localhost:3000', 'http://localhost:5000'], credentials: true }));

// Body parsing middleware — make sure to add multipart/form-data parser like multer in artisanRoutes if needed
app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

// Serve uploads folder statically for file access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// API routes
app.use('/auth', authRoutes);
app.use('/artisan', artisanRoutes);

// Default route for sanity check
app.get('/', (req, res) => {
  res.send('Hello Artisan API 👋');
});

// Export app for serverless deployment (e.g., Vercel)
module.exports = app;

// Start local server only if NOT deployed on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}
