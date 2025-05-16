const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require('./Routes/auth/authRoutes');

const app = express();

app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello Artisan API 👋');
});

// Export app for Vercel
module.exports = app;

// Start local server only if NOT on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}
