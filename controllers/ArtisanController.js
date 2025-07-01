const ArtisanProfile = require("../Models/ArtisanProfiles");
const User = require("../Models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const cloudinary = require('../utils/cloudinary'); // ✅ cloudinary uploader helper
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
    // ✅ Step 1: Authenticate user
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    // ✅ Step 2: Validate user and role
    const user = await User.findById(userId);
    if (!user || user.role !== "artisan") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      });
    }

    // ✅ Step 3: Check for artisan profile
    const profile = await ArtisanProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PROFILE_NOT_FOUND",
          message: "Artisan profile missing",
        },
      });
    }

    // ✅ Step 4: Parse personal and professional info
    let personalInfo, professionalInfo;
    const errors = [];
    try {
      personalInfo = JSON.parse(req.body.personalInfo);
      professionalInfo = JSON.parse(req.body.professionalInfo);
    } catch {
      errors.push({
        field: "JSON",
        message: "Invalid JSON in personal/professional info",
      });
    }

    // ✅ Step 5: Validate text fields
    if (!personalInfo?.name)
      errors.push({ field: "name", message: "Name is required" });
    if (!personalInfo?.phoneNumber)
      errors.push({ field: "phone", message: "Phone is required" });
    if (!professionalInfo?.artisanType)
      errors.push({
        field: "artisanType",
        message: "Artisan type is required",
      });

    // ✅ Step 6: Validate file uploads
    const files = req.files || {};
    const requiredFiles = [
      "passportPhoto",
      "govIdCard",
      "businessCertificate",
      "proofOfAddress",
    ];

    requiredFiles.forEach((field) => {
      if (!files[field]) {
        errors.push({ field, message: `${field} is required` });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", details: errors },
      });
    }

    // ✅ Step 7: Upload files to Cloudinary
    const verificationDocuments = {};

    for (const field of requiredFiles) {
      const file = files[field][0];

      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "artisans",
        });

        verificationDocuments[field] = result.secure_url;

        // ✅ Delete file locally after upload
        fs.unlinkSync(file.path);
      } catch (uploadErr) {
        return res.status(500).json({
          success: false,
          error: {
            code: "UPLOAD_ERROR",
            message: `Failed to upload ${field} to Cloudinary`,
            details: uploadErr.message,
          },
        });
      }
    }

    // ✅ Step 8: Update artisan profile
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

    // ✅ Step 9: Mark user profile as completed
    await User.findByIdAndUpdate(userId, { profileCompleted: true });

    // ✅ Step 10: Respond success
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

//..................get artisan profile.................
const getArtisanProfile = async (req, res) => {
  try {
    const profile = await ArtisanProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      return res.status(404).json({ message: "Artisan profile not found" });
    }

    // Format the profile like your UI expects
    const formatted = {
      name: profile.personalInfo.name,
      profession: profile.professionalInfo.artisanType,
      location: `${profile.personalInfo.city}, ${profile.personalInfo.state}`,
      pricePerHour: profile.professionalInfo.skills?.[0]?.pricing?.pricePerHour || null,
      profilePicture: profile.verificationDocuments.passportPhoto,
      businessName: profile.professionalInfo.businessName,
      availability: profile.professionalInfo.skills?.[0]?.pricing?.availability || null,

      // ✅ NEW: Pull all uploaded certifications
      certifications: profile.verificationDocuments.businessCertificates || [],

      about: profile.professionalInfo.bio || "No bio added yet"
    };

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//..................search artisan.................

const searchArtisans = async (req, res) => {
  try {
    const { name, location, work, page = 1, limit = 10 } = req.query;

    // ✅ Pagination variables
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ✅ Dynamic query builder
    const query = {};

    if (name) {
      query['personalInfo.name'] = { $regex: name, $options: 'i' };
    }

    if (location) {
      query.$or = [
        { 'personalInfo.state': { $regex: location, $options: 'i' } },
        { 'personalInfo.city': { $regex: location, $options: 'i' } },
        { 'personalInfo.localGovernment': { $regex: location, $options: 'i' } },
      ];
    }

    if (work) {
      query['professionalInfo.artisanType'] = { $regex: work, $options: 'i' };
    }

    // ✅ If no filter, return all artisans (fallback)
    const totalCount = await ArtisanProfile.countDocuments(query);
    const results = await ArtisanProfile.find(query)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      totalCount,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("❌ Error in searchArtisans:", error);
    res.status(500).json({
      success: false,
      message: "Server error during search",
      error: error.message,
    });
  }
};
const uploadProjectMedia = async (req, res) => {
  try {
    const artisanId = req.params.id;

    // ✅ Find the artisan by userId (not _id of profile)
    const artisan = await ArtisanProfile.findOne({ userId: artisanId });

    if (!artisan) {
      return res.status(404).json({ success: false, message: "Artisan not found" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No media file uploaded" });
    }

    const isVideo = req.file.mimetype.startsWith("video");

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: isVideo ? "video" : "image",
      folder: "artisan_projects",
    });

    // ✅ Remove local temp file
    fs.unlinkSync(req.file.path);

    // ✅ Prepare media info
    const projectData = {
      title: req.body.title || "Untitled",
      type: isVideo ? "video" : "image",
      url: result.secure_url,
      uploadedAt: new Date(),
    };

    // ✅ Add to projects array
    artisan.projects = artisan.projects || [];
    artisan.projects.push(projectData);
    await artisan.save();

    return res.status(200).json({
      success: true,
      message: "Project media uploaded successfully",
      project: artisan.projects.at(-1),
    });
  } catch (error) {
    console.error("❌ Error uploading project:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};





module.exports = {
  registerArtisan,
  loginArtisan,
  completeArtisanProfile,
  getArtisanProfile,
    searchArtisans, 
uploadProjectMedia
};
