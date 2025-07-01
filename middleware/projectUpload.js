const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the folder exists
const uploadDir = 'uploads/projects';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

const projectUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max (adjust if needed)
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, MP4, and MOV files allowed'));
    }
  },
});

module.exports = projectUpload;
