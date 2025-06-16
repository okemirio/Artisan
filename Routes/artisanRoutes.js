const express = require('express');
const router = express.Router();

const artisanUpload = require('../middleware/artisanUpload'); // Multer config
const { registerArtisan, loginArtisan } = require('../controllers/ArtisanController'); // ✅ Include loginArtisan

// ✅ Register Artisan (with file uploads)
router.post('/register-artisan', artisanUpload, registerArtisan);

// ✅ Login Artisan (no file upload needed)
router.post('/login-artisan', loginArtisan);

module.exports = router;
