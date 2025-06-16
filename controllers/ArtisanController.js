const ArtisanProfile = require("../Models/ArtisanProfiles");
const User = require("../Models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const registerArtisan = async (req, res) => {
  try {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    // Input validation
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
