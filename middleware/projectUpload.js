const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Ensure /tmp folder exists for temporary file storage
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log('✅ Created /tmp directory for uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir); // 🔁 Save temporarily here before Cloudinary upload
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const projectUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // ✅ 20MB max
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
