const ArtisanProfile = require('../Models/ArtisanProfiles');
const User = require('../Models/user');
const bcrypt = require('bcryptjs');

const registerArtisan = async (req, res) => {
  try {
    const errors = [];

    // Step 1: Parse JSON fields from multipart/form-data
    let personalInfo, professionalInfo;
    try {
      personalInfo = JSON.parse(req.body.personalInfo);
    } catch {
      errors.push({ field: "personalInfo", message: "Invalid JSON format for personalInfo" });
    }

    try {
      professionalInfo = JSON.parse(req.body.professionalInfo);
    } catch {
      errors.push({ field: "professionalInfo", message: "Invalid JSON format for professionalInfo" });
    }

    // Destructure other fields
    const { password, firstname, lastname } = req.body;

    // Step 2: Validate all required fields (strict checks)
    if (!personalInfo?.name) errors.push({ field: "personalInfo.name", message: "\"personalInfo.name\" is required" });
    if (!personalInfo?.email) errors.push({ field: "personalInfo.email", message: "\"personalInfo.email\" is required" });
    if (!personalInfo?.phoneNumber && !personalInfo?.phone) errors.push({ field: "personalInfo.phoneNumber", message: "\"personalInfo.phoneNumber\" is required" });
    if (!personalInfo?.fullAddress && !personalInfo?.address) errors.push({ field: "personalInfo.fullAddress", message: "\"personalInfo.fullAddress\" is required" });

    if (!professionalInfo?.businessName) errors.push({ field: "professionalInfo.businessName", message: "\"professionalInfo.businessName\" is required" });
    if (!professionalInfo?.artisanType) errors.push({ field: "professionalInfo.artisanType", message: "\"professionalInfo.artisanType\" is required" });

    if (!password) errors.push({ field: "password", message: "\"password\" is required" });
    if (!firstname) errors.push({ field: "firstname", message: "\"firstname\" is required" });
    if (!lastname) errors.push({ field: "lastname", message: "\"lastname\" is required" });

    // Step 3: Validate uploaded files existence
    const files = req.files || {};
    if (!files.passportPhoto) errors.push({ field: "passportPhoto", message: "\"passportPhoto\" file is required" });
    if (!files.govIdCard) errors.push({ field: "govIdCard", message: "\"govIdCard\" file is required" });
    if (!files.businessCertificate) errors.push({ field: "businessCertificate", message: "\"businessCertificate\" file is required" });
    if (!files.proofOfAddress) errors.push({ field: "proofOfAddress", message: "\"proofOfAddress\" file is required" });

    // Step 4: Return errors if any
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: errors
        }
      });
    }

    // Step 5: Check if user with this email already exists (case-insensitive)
    const existingUser = await User.findOne({ email: personalInfo.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: "USER_EXISTS",
          message: "User already exists with this email"
        }
      });
    }

    // Step 6: Hash password securely
    const hashedPassword = await bcrypt.hash(password, 12); // use 12 rounds for better security

    // Step 7: Create new User
    const newUser = new User({
      firstname,
      lastname,
      email: personalInfo.email.toLowerCase(),
      password: hashedPassword,
      role: 'artisan'
    });
    await newUser.save();

    // Step 8: Map uploaded files to their filenames (store just filenames, or full URLs if you prefer)
    const verificationDocuments = {
      passportPhoto: files.passportPhoto[0].filename,
      govIdCard: files.govIdCard[0].filename,
      businessCertificate: files.businessCertificate[0].filename,
      proofOfAddress: files.proofOfAddress[0].filename
    };

    // Step 9: Create artisan profile linked to userId
    const artisanProfile = new ArtisanProfile({
      userId: newUser._id,
      personalInfo,
      professionalInfo,
      verificationDocuments,
      status: 'pending'
    });
    await artisanProfile.save();

    // Step 10: Return success response
    return res.status(201).json({
      success: true,
      message: 'Artisan account created successfully. Pending verification.',
      artisanProfileId: artisanProfile._id
    });

  } catch (error) {
    console.error('Error in registerArtisan:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error during artisan signup",
        details: error.message
      }
    });
  }
};

module.exports = { registerArtisan };
