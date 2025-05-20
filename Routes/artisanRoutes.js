const express = require('express');
const router = express.Router();

const artisanUpload = require('../middleware/artisanUpload'); // import multer config
const { registerArtisan } = require('../controllers/ArtisanController');

// Use artisanUpload middleware before controller to handle files + multipart/form-data
router.post('/register-artisan', artisanUpload, registerArtisan);

module.exports = router;
