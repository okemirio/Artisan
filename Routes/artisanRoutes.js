const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/verifyToken');
const artisanUpload = require('../middleware/artisanUpload');
const projectUpload = require('../middleware/projectUpload'); // ✅ NEW
const authMiddleware = require("../middleware/authMiddleware");

const {
  registerArtisan,
  loginArtisan,
  completeArtisanProfile,
  getArtisanProfile,
  searchArtisans,
  uploadProjectMedia // ✅ NEW
} = require('../controllers/ArtisanController');

// ✅ Manual Registration for Artisans
router.post('/register-artisan', registerArtisan);

// ✅ Manual Login for Artisans
router.post('/login-artisan', loginArtisan);

// ✅ Get Artisan Profile by User ID
router.get('/profile/:userId', getArtisanProfile);

// ✅ Search for artisans by name, location or work
router.get('/search', searchArtisans);

// ✅ Complete Artisan Profile (Google or Manual - protected route)
router.post(
  '/complete-profile',
  authMiddleware,
  artisanUpload,           // Uploads: passportPhoto, govIdCard, etc.
  completeArtisanProfile
);

// ✅ Upload a project (image/video) for an artisan
router.post(
  '/:id/upload-project',
  authenticate,
  projectUpload.single('media'), // ✅ this is likely undefined!
  uploadProjectMedia              // ✅ or this might be missing
);


module.exports = router;
