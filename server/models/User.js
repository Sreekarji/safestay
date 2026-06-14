const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,      // ✅ This already creates an index on email
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["student", "owner", "admin"],
    default: "student",
  },
  phone: {
    type: String,
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // ✅ College verification fields (for students)
  isCollegeVerified: {
    type: Boolean,
    default: false
  },
  collegeName: {
    type: String,
    default: null
  },
  
  // ✅ Profile photo
  profilePhoto: {
    type: String,
    default: null
  },
  
  // ✅ OWNER-SPECIFIC FIELDS
  propertyName: {
    type: String,
    default: null
  },
  propertyCount: {
    type: String,
    default: null
  },
  
  // ✅ OWNER VERIFICATION SYSTEM
  ownerVerificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'verified', 'rejected'],
    default: function() {
      return this.role === 'owner' ? 'pending' : null;
    }
  },
  
  // ✅ Verification Documents (Cloudinary URLs)
  verificationDocuments: {
    governmentId: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null }
    },
    propertyProof: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null }
    },
    businessRegistration: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null }
    },
    propertyPhotos: [{
      url: { type: String },
      publicId: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  
  // ✅ Verification Metadata
  verificationSubmittedAt: {
    type: Date,
    default: null
  },
  verificationReviewedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  
  // ✅ Additional Owner Info
  businessAddress: {
    type: String,
    default: null
  },
  gstNumber: {
    type: String,
    default: null
  },
  
}, { timestamps: true });

// ✅ Compound index for admin queries (owner verification listing)
userSchema.index({ role: 1, ownerVerificationStatus: 1 });

// ❌ REMOVED: userSchema.index({ email: 1 });
// Reason: "unique: true" on email field already creates this index

module.exports = mongoose.model("User", userSchema);