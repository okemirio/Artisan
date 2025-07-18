const mongoose = require("mongoose");

const artisanProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    personalInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phoneNumber: { type: String, required: false },
      gender: { type: String, enum: ["male", "female", "other"] },
      fullAddress: String,
      state: String,
      city: String,
      localGovernment: String,
    },

    professionalInfo: {
      businessName: String,
      artisanType: String,
      skills: [
        {
          skillName: String,
          pricing: {
            pricePerHour: Number,
            availability: String,
            address: String,
          },
        },
      ],
    },

    verificationDocuments: {
      passport: String,
      id: String,
      cert: [String],
      proof: String,
    },
    projects: [
      {
        title: { type: String },
        type: { type: String, enum: ["image", "video"], required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["incomplete", "pending", "approved", "rejected"], // ✅ Added 'incomplete'
      default: "incomplete", // ✅ Default set to 'incomplete'
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ArtisanProfile", artisanProfileSchema);
