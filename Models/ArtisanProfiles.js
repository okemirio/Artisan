const mongoose = require('mongoose');

const artisanProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  personalInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: false },
    gender: { type: String, enum: ['male', 'female', 'other'] },
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
        }
      }
    ],
  },

  verificationDocuments: {
  
    passportPhoto: String,
    govIdCard: String,
    businessCertificate: String,
    proofOfAddress: String,
  },

  status: {
    type: String,
    enum: ['incomplete', 'pending', 'approved', 'rejected'], // ✅ Added 'incomplete'
    default: 'incomplete' // ✅ Default set to 'incomplete'
  }
}, { timestamps: true });

module.exports = mongoose.model('ArtisanProfile', artisanProfileSchema);
