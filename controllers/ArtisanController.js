const ArtisanProfile = require("../Models/ArtisanProfiles");
const User = require("../Models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// const registerArtisan = async (req, res) => {
//   try {
//     const errors = [];

//     let personalInfo, professionalInfo;
//     try {
//       personalInfo = JSON.parse(req.body?.personalInfo);
//     } catch {
//       errors.push({ field: "personalInfo", message: "Invalid JSON format for personalInfo" });
//     }

//     try {
//       professionalInfo = JSON.parse(req.body?.professionalInfo);
//     } catch {
//       errors.push({ field: "professionalInfo", message: "Invalid JSON format for professionalInfo" });
//     }

//     const { password, firstname, lastname } = req.body;

//     if (!personalInfo?.name)
//       errors.push({ field: "personalInfo.name", message: "Name is required" });
//     if (!personalInfo?.email)
//       errors.push({ field: "personalInfo.email", message: "Email is required" });
//     if (!personalInfo?.phoneNumber)
//       errors.push({ field: "personalInfo.phoneNumber", message: "Phone number is required" });
//     if (!personalInfo?.fullAddress)
//       errors.push({ field: "personalInfo.fullAddress", message: "Full address is required" });

//     if (!professionalInfo?.businessName)
//       errors.push({ field: "professionalInfo.businessName", message: "Business name is required" });
//     if (!professionalInfo?.artisanType)
//       errors.push({ field: "professionalInfo.artisanType", message: "Artisan type is required" });

//     if (!password) errors.push({ field: "password", message: "Password is required" });
//     if (!firstname) errors.push({ field: "firstname", message: "Firstname is required" });
//     if (!lastname) errors.push({ field: "lastname", message: "Lastname is required" });

//     const files = req.files || {};
//     const requiredFiles = [
//       "passportPhoto",
//       "govIdCard",
//       "businessCertificate",
//       "proofOfAddress",
//     ];
//     requiredFiles.forEach((field) => {
//       if (!files[field]) {
//         errors.push({ field, message: `${field} file is required` });
//       }
//     });

//     if (errors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         error: {
//           code: "VALIDATION_ERROR",
//           message: "Validation failed",
//           details: errors,
//         },
//       });
//     }

//     const existingUser = await User.findOne({ email: personalInfo.email.toLowerCase() });

//     if (existingUser) {
//       const existingProfile = await ArtisanProfile.findOne({ userId: existingUser._id });

//       if (existingProfile) {
//         return res.status(400).json({
//           success: false,
//           error: {
//             code: "USER_EXISTS",
//             message: "User is already registered as an artisan",
//           },
//         });
//       }

//       return res.status(400).json({
//         success: false,
//         error: {
//           code: "NOT_ARTISAN",
//           message: "User already exists but is not registered as an artisan",
//         },
//       });
//     }

//     // ✅ Hash password properly
//     const hashedPassword = await bcrypt.hash(password, 12);

//     const newUser = new User({
//       firstname,
//       lastname,
//       email: personalInfo.email.toLowerCase(),
//       password: hashedPassword,
//       role: "artisan",
//     });

//     await newUser.save();

//     const baseUrl = process.env.FILE_BASE_URL || "";

//     const verificationDocuments = {
//       passportPhoto: baseUrl + files.passportPhoto[0].filename,
//       govIdCard: baseUrl + files.govIdCard[0].filename,
//       businessCertificate: baseUrl + files.businessCertificate[0].filename,
//       proofOfAddress: baseUrl + files.proofOfAddress[0].filename,
//     };

//     const artisanProfile = new ArtisanProfile({
//       userId: newUser._id,
//       personalInfo,
//       professionalInfo,
//       verificationDocuments,
//       status: "pending", // ✅ Now default to "pending" for production
//     });

//     await artisanProfile.save();

//     return res.status(201).json({
//       success: true,
//       message: "Artisan profile created successfully. Awaiting approval.",
//       artisanProfileId: artisanProfile._id,
//     });
//   } catch (error) {
//     if (process.env.NODE_ENV !== "production") {
//       console.error("Error in registerArtisan:", error);
//     }

//     return res.status(500).json({
//       success: false,
//       error: {
//         code: "SERVER_ERROR",
//         message: "Internal server error during artisan signup",
//         details: error.message,
//       },
//     });
//   }
// };
const registerArtisan = async (req, res) => {
  try {
    const { firstname, lastname, email, password, confirmPassword, role } = req.body;

    // Input validation
    if (!firstname || !lastname || !email || !password || !confirmPassword, !role) {
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

    // Check if email already exists
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new User({
      firstname,
      lastname,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "artisan",
    });

    await newUser.save();

    // Create JWT token
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

const loginArtisan = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
        },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_FAILED",
          message: "Invalid email or password",
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_FAILED",
          message: "Invalid email or password",
        },
      });
    }

    if (user.role !== "artisan") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied. Not an artisan account.",
        },
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const artisanProfile = await ArtisanProfile.findOne({ userId: user._id });

    if (!artisanProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PROFILE_NOT_FOUND",
          message: "Artisan profile not found",
        },
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
    if (process.env.NODE_ENV !== "production") {
      console.error("Error in loginArtisan:", error);
    }

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


module.exports = { registerArtisan, loginArtisan };
