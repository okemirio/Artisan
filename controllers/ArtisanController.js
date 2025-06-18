const ArtisanProfile = require("../Models/ArtisanProfiles");
const User = require("../Models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ------------------ Register Artisan ------------------

const registerArtisan = async (req, res) => {
  try {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "All fields are required",
        },
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PASSWORD_MISMATCH",
          message: "Passwords do not match",
        },
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_EMAIL",
          message: "Email already exists",
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      firstname,
      lastname,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "artisan",
    });

    await newUser.save();

    // ✅ Create a minimal ArtisanProfile with status "incomplete"
    const artisanProfile = new ArtisanProfile({
      userId: newUser._id,
      personalInfo: {
        name: `${firstname} ${lastname}`,
        email: newUser.email
        // phoneNumber is optional
      },
      status: "incomplete" // ✅ Allowed by updated schema
    });

    await artisanProfile.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Artisan registered successfully",
      token,
      user: {
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error in registerArtisan:", error);
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error during artisan registration",
        details: error.message,
      },
    });
  }
};


// ------------------ Login Artisan ------------------
const loginArtisan = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Email and password are required" },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_FAILED", message: "Invalid email or password" },
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Check for ArtisanProfile (will always exist due to registration logic)
    const artisanProfile = await ArtisanProfile.findOne({ userId: user._id });

    if (!artisanProfile) {
      return res.status(404).json({
        success: false,
        error: { code: "PROFILE_NOT_FOUND", message: "Artisan profile not found" },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
      artisanProfile,
    });
  } catch (error) {
    console.error("Error in loginArtisan:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error during artisan login",
        details: error.message,
      },
    });
  }
};

// ------------------ Complete Artisan Profile ------------------
const completeArtisanProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "artisan") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      });
    }

    const profile = await ArtisanProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: "PROFILE_NOT_FOUND", message: "Artisan profile missing" },
      });
    }

    // Parse fields
    let personalInfo, professionalInfo;
    const errors = [];
    try {
      personalInfo = JSON.parse(req.body.personalInfo);
      professionalInfo = JSON.parse(req.body.professionalInfo);
    } catch {
      errors.push({ field: "JSON", message: "Invalid JSON in personal/professional info" });
    }

    // Validate required inputs
    if (!personalInfo?.name) errors.push({ field: "name", message: "Name is required" });
    if (!personalInfo?.phoneNumber) errors.push({ field: "phone", message: "Phone is required" });
    if (!professionalInfo?.artisanType) errors.push({ field: "artisanType", message: "Artisan type is required" });

    // Validate file uploads
    const files = req.files || {};
    const requiredFiles = ["passportPhoto", "govIdCard", "businessCertificate", "proofOfAddress"];
    requiredFiles.forEach((field) => {
      if (!files[field]) errors.push({ field, message: `${field} is required` });
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", details: errors },
      });
    }

    const baseUrl = process.env.FILE_BASE_URL || "";
    const verificationDocuments = {
      passportPhoto: baseUrl + files.passportPhoto[0].filename,
      govIdCard: baseUrl + files.govIdCard[0].filename,
      businessCertificate: baseUrl + files.businessCertificate[0].filename,
      proofOfAddress: baseUrl + files.proofOfAddress[0].filename,
    };

    // ✅ Update existing ArtisanProfile
    const updatedProfile = await ArtisanProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          personalInfo,
          professionalInfo,
          verificationDocuments,
          status: "pending",
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile completed and submitted for review",
      artisanProfile: updatedProfile,
    });
  } catch (error) {
    console.error("Error completing artisan profile:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message },
    });
  }
};

module.exports = {
  registerArtisan,
  loginArtisan,
  completeArtisanProfile,
};
