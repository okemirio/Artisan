const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/artisans/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only JPEG, PNG, and PDF allowed.'));
    }
  }
});

const artisanUpload = upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'govIdCard', maxCount: 1 },
  { name: 'businessCertificate', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
]);

module.exports = artisanUpload;
