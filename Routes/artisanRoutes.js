const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/verifyToken');
const artisanUpload = require('../middleware/artisanUpload'); // Multer config

const {
  registerArtisan,
  loginArtisan,
  completeArtisanProfile,getArtisanProfile,searchArtisans,

} = require('../controllers/ArtisanController');

// ✅ Manual Registration for Artisans (optional file uploads can be added later)
router.post('/register-artisan', registerArtisan);

// ✅ Manual Login for Artisans
router.post('/login-artisan', loginArtisan);
// getting customers profile setup
router.get('/profile/:userId', getArtisanProfile);
// getting artisan by search
router.get('/search', searchArtisans); // 


// ✅ Step 3: Complete Artisan Profile (Google or Manual - protected route)
router.post(
  '/complete-profile',
  authenticate,            // Verifies token from both manual and Google login
  artisanUpload,           // Handles file uploads: passportPhoto, govIdCard, etc.
  completeArtisanProfile, // Controller handles validation & saving
  getArtisanProfile, // handles getting customers detailed from completed registation
  searchArtisans, // handles search for artisans 

);

module.exports = router;
