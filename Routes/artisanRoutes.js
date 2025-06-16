const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/verifyToken')

const artisanUpload = require('../middleware/artisanUpload'); // Multer config
const { registerArtisan, loginArtisan, completeArtisanProfile } = require('../controllers/ArtisanController'); // ✅ Include loginArtisan

// ✅ Register Artisan (with file uploads)
router.post('/register-artisan', registerArtisan);

// ✅ Login Artisan (no file upload needed)
router.post('/login-artisan', loginArtisan);

// ✅ Step 3: Complete Artisan Profile (protected + files)
router.post(
    '/complete-profile',
    authenticate,
    artisanUpload,
    completeArtisanProfile
);

module.exports = router;
