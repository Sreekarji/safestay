# SafeStay — All Server Source Code

Total files: 20 | Total lines: 5,718

---

## cloudinary.js (38 lines)

```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure CloudinaryStorage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'student-safety-reports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' }
    ]
  }
});

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
    }
  }
});

module.exports = { cloudinary, upload };
```

---

## adminMiddleware.js (19 lines)

```javascript
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }

  next();
};

module.exports = adminMiddleware;
```

---

## authMiddleware.js (22 lines)

```javascript
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header("Authorization")?.split(" ")[1] || req.header("x-auth-token");

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
```

---

## ownerMiddleware.js (56 lines)

```javascript
const ownerMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Accommodation owner access required'
    });
  }

  // ✅ Check verification status from JWT payload (no DB query needed!)
  const status = req.user.ownerVerificationStatus;

  if (status === 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending verification. Please wait for admin approval.',
      verificationStatus: 'pending',
      requiresVerification: true
    });
  }

  if (status === 'under_review') {
    return res.status(403).json({
      success: false,
      message: 'Your documents are currently under review.',
      verificationStatus: 'under_review',
      requiresVerification: true
    });
  }

  if (status === 'rejected') {
    return res.status(403).json({
      success: false,
      message: 'Your verification was rejected. Please reapply with correct documents.',
      verificationStatus: 'rejected',
      canReapply: true
    });
  }

  if (status !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Invalid verification status. Please contact support.'
    });
  }

  // ✅ Owner is verified
  next();
};

module.exports = ownerMiddleware;```

---

## Accommodation.js (106 lines)

```javascript
const mongoose = require('mongoose');

const AccommodationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amenities: [{
    type: String
  }],
  totalRooms: {
    type: Number,
    required: true
  },
  occupiedRooms: {
    type: Number,
    default: 0
  },
  pricePerMonth: {
    type: Number,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  riskScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  trustScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  trustScoreLabel: {
    type: String,
    enum: ['Safe', 'Caution', 'Unsafe'],
    default: 'Safe'
  },
  trustScoreColor: {
    type: String,
    enum: ['green', 'yellow', 'red'],
    default: 'green'
  },
  totalReports: {
    type: Number,
    default: 0
  },
  lastScoreUpdate: {
    type: Date,
    default: Date.now
  }
});

AccommodationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Accommodation', AccommodationSchema);
```

---

## CounterReport.js (51 lines)

```javascript
const mongoose = require('mongoose');

const CounterReportSchema = new mongoose.Schema({
  originalReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  accommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['false_information', 'outdated_issue', 'mistaken_identity', 'resolved_issue', 'malicious_intent', 'other']
  },
  explanation: {
    type: String,
    required: true
  },
  evidenceUrls: [{
    type: String
  }],
  evidenceDescription: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  }
});

module.exports = mongoose.model('CounterReport', CounterReportSchema);
```

---

## OTP.js (32 lines)

```javascript
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['verification', 'password-reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

otpSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model('OTP', otpSchema);
```

---

## Report.js (169 lines)

```javascript
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  accommodationName: {
    type: String,
    required: true,
    trim: true
  },
  accommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accommodation',
    default: null
  },
  issueType: {
    type: String,
    required: true,
    enum: ['Food Safety', 'Water Quality', 'Hygiene', 'Security', 'Infrastructure']
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resolved', 'verified', 'disputed'],
    default: 'pending'
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isCountered: {
    type: Boolean,
    default: false
  },
  counterStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', null],
    default: null
  },
  // Resolution by owner
  resolution: {
    description: {
      type: String,
      default: ''
    },
    actionTaken: {
      type: String,
      default: ''
    },
    images: [{
      url: String,
      publicId: String
    }],
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  // Verification by student
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    feedback: {
      type: String,
      default: ''
    },
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputeReason: {
      type: String,
      default: ''
    }
  },
  // ✅ AI Verification Fields
  aiVerification: {
    verdict: {
      type: String,
      enum: ['VERIFIED', 'REJECTED', 'NEEDS_REVIEW', null],
      default: null
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'none', 'unknown', null],
      default: null
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    summary: {
      type: String,
      default: null
    },
    recommendAdminReview: {
      type: Boolean,
      default: false
    },
    details: {
      gemini: {
        type: Object,
        default: null
      },
      groq: {
        type: Object,
        default: null
      },
      mistral: {
        type: Object,
        default: null
      }
    },
    timestamp: {
      type: Date,
      default: null
    }
  }
}, { 
  timestamps: true 
});

// ✅ Indexes for better query performance
reportSchema.index({ user: 1 });
reportSchema.index({ accommodation: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'aiVerification.verdict': 1 });
reportSchema.index({ 'aiVerification.recommendAdminReview': 1 });

module.exports = mongoose.model('Report', reportSchema);```

---

## User.js (131 lines)

```javascript
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

module.exports = mongoose.model("User", userSchema);```

---

## admin.js (925 lines)

```javascript
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Models
const User = require("../models/User");
const Report = require("../models/Report");
const Accommodation = require("../models/Accommodation");
const CounterReport = require("../models/CounterReport");

// Middleware
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Apply auth + admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================
// 📊 DASHBOARD STATS
// ============================================

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get("/stats", async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalOwners = await User.countDocuments({ role: "owner" });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Owner verification stats
    const pendingOwners = await User.countDocuments({ 
      role: "owner", 
      ownerVerificationStatus: "pending" 
    });
    const underReviewOwners = await User.countDocuments({ 
      role: "owner", 
      ownerVerificationStatus: "under_review" 
    });
    const verifiedOwners = await User.countDocuments({ 
      role: "owner", 
      ownerVerificationStatus: "verified" 
    });
    const rejectedOwners = await User.countDocuments({ 
      role: "owner", 
      ownerVerificationStatus: "rejected" 
    });

    // Report stats
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: "pending" });
    const approvedReports = await Report.countDocuments({ status: "approved" });
    const resolvedReports = await Report.countDocuments({ status: "resolved" });
    const rejectedReports = await Report.countDocuments({ status: "rejected" });

    // Accommodation stats
    const totalAccommodations = await Accommodation.countDocuments();

    // Counter reports
    const pendingCounterReports = await CounterReport.countDocuments({ status: "pending" });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          owners: totalOwners,
          banned: bannedUsers
        },
        ownerVerifications: {
          pending: pendingOwners,
          underReview: underReviewOwners,
          verified: verifiedOwners,
          rejected: rejectedOwners,
          total: totalOwners
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          approved: approvedReports,
          resolved: resolvedReports,
          rejected: rejectedReports
        },
        accommodations: {
          total: totalAccommodations
        },
        counterReports: {
          pending: pendingCounterReports
        }
      }
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching admin statistics"
    });
  }
});

// ============================================
// 👥 USER MANAGEMENT
// ============================================

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Admin
router.get("/users", async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search, isBanned } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching users"
    });
  }
});

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban or unban a user
// @access  Admin
router.put("/users/:id/ban", async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent banning admins
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot ban admin users"
      });
    }

    user.isBanned = isBanned;
    user.banReason = isBanned ? reason : null;
    user.bannedAt = isBanned ? new Date() : null;
    user.bannedBy = isBanned ? req.user.id : null;
    await user.save();

    res.json({
      success: true,
      message: isBanned ? "User banned successfully" : "User unbanned successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBanned: user.isBanned
      }
    });
  } catch (err) {
    console.error("Ban user error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating user ban status"
    });
  }
});

// ============================================
// ✅ OWNER VERIFICATION MANAGEMENT
// ============================================

// @route   GET /api/admin/owner-verifications
// @desc    Get all owner verification requests
// @access  Admin
router.get("/owner-verifications", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { role: "owner" };
    if (status) {
      query.ownerVerificationStatus = status;
    }

    const owners = await User.find(query)
      .select("-password")
      .sort({ verificationSubmittedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    // Get counts by status
    const statusCounts = {
      pending: await User.countDocuments({ role: "owner", ownerVerificationStatus: "pending" }),
      under_review: await User.countDocuments({ role: "owner", ownerVerificationStatus: "under_review" }),
      verified: await User.countDocuments({ role: "owner", ownerVerificationStatus: "verified" }),
      rejected: await User.countDocuments({ role: "owner", ownerVerificationStatus: "rejected" })
    };

    res.json({
      success: true,
      owners,
      statusCounts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error("Get owner verifications error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching owner verifications"
    });
  }
});

// @route   GET /api/admin/owner-verifications/:id
// @desc    Get single owner verification details with documents
// @access  Admin
router.get("/owner-verifications/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID"
      });
    }

    const owner = await User.findOne({ _id: id, role: "owner" })
      .select("-password")
      .lean();

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    // Get owner's accommodations count (if any)
    const accommodationsCount = await Accommodation.countDocuments({ owner: id });

    // Get reports against owner's properties
    const accommodationIds = await Accommodation.find({ owner: id }).select("_id");
    const reportsCount = await Report.countDocuments({ 
      accommodation: { $in: accommodationIds.map(a => a._id) }
    });

    res.json({
      success: true,
      owner: {
        ...owner,
        stats: {
          accommodations: accommodationsCount,
          reportsAgainstProperties: reportsCount
        }
      }
    });
  } catch (err) {
    console.error("Get owner details error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching owner details"
    });
  }
});

// @route   PUT /api/admin/owner-verifications/:id/review
// @desc    Mark owner verification as under review
// @access  Admin
router.put("/owner-verifications/:id/review", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID"
      });
    }

    const owner = await User.findOne({ _id: id, role: "owner" });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    if (owner.ownerVerificationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as under review. Current status: ${owner.ownerVerificationStatus}`
      });
    }

    owner.ownerVerificationStatus = "under_review";
    owner.verificationReviewedAt = new Date();
    owner.verifiedBy = req.user.id;
    await owner.save();

    console.log(`✅ Owner ${owner.email} marked as under review by admin ${req.user.id}`);

    res.json({
      success: true,
      message: "Owner verification marked as under review",
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        ownerVerificationStatus: owner.ownerVerificationStatus
      }
    });
  } catch (err) {
    console.error("Review owner error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating verification status"
    });
  }
});

// @route   PUT /api/admin/owner-verifications/:id/approve
// @desc    Approve owner verification
// @access  Admin
router.put("/owner-verifications/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body; // Optional admin notes

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID"
      });
    }

    const owner = await User.findOne({ _id: id, role: "owner" });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    // Can approve from pending or under_review status
    if (!["pending", "under_review", "rejected"].includes(owner.ownerVerificationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Current status: ${owner.ownerVerificationStatus}`
      });
    }

    // Update owner status
    owner.ownerVerificationStatus = "verified";
    owner.isVerified = true;
    owner.verificationReviewedAt = new Date();
    owner.verifiedBy = req.user.id;
    owner.rejectionReason = null; // Clear any previous rejection reason
    owner.adminNotes = notes || null;
    await owner.save();

    console.log(`✅ Owner ${owner.email} APPROVED by admin ${req.user.id}`);

    // TODO: Send approval email to owner
    // await sendOwnerApprovalEmail(owner.email, owner.name);

    res.json({
      success: true,
      message: "Owner verification approved successfully",
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        ownerVerificationStatus: owner.ownerVerificationStatus,
        verifiedAt: owner.verificationReviewedAt
      }
    });
  } catch (err) {
    console.error("Approve owner error:", err);
    res.status(500).json({
      success: false,
      message: "Error approving owner verification"
    });
  }
});

// @route   PUT /api/admin/owner-verifications/:id/reject
// @desc    Reject owner verification
// @access  Admin
router.put("/owner-verifications/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID"
      });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason (minimum 10 characters)"
      });
    }

    const owner = await User.findOne({ _id: id, role: "owner" });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    // Can reject from pending or under_review status
    if (!["pending", "under_review"].includes(owner.ownerVerificationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject. Current status: ${owner.ownerVerificationStatus}`
      });
    }

    // Update owner status
    owner.ownerVerificationStatus = "rejected";
    owner.isVerified = false;
    owner.verificationReviewedAt = new Date();
    owner.verifiedBy = req.user.id;
    owner.rejectionReason = reason.trim();
    await owner.save();

    console.log(`❌ Owner ${owner.email} REJECTED by admin ${req.user.id}. Reason: ${reason}`);

    // TODO: Send rejection email to owner
    // await sendOwnerRejectionEmail(owner.email, owner.name, reason);

    res.json({
      success: true,
      message: "Owner verification rejected",
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        ownerVerificationStatus: owner.ownerVerificationStatus,
        rejectionReason: owner.rejectionReason
      }
    });
  } catch (err) {
    console.error("Reject owner error:", err);
    res.status(500).json({
      success: false,
      message: "Error rejecting owner verification"
    });
  }
});

// @route   PUT /api/admin/owner-verifications/:id/revert
// @desc    Revert verified owner back to pending (for re-review)
// @access  Admin
router.put("/owner-verifications/:id/revert", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID"
      });
    }

    const owner = await User.findOne({ _id: id, role: "owner" });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    // Store previous status for logging
    const previousStatus = owner.ownerVerificationStatus;

    // Update owner status
    owner.ownerVerificationStatus = "pending";
    owner.isVerified = false;
    owner.verificationReviewedAt = null;
    owner.verifiedBy = null;
    owner.rejectionReason = null;
    owner.adminNotes = reason ? `Reverted from ${previousStatus}: ${reason}` : `Reverted from ${previousStatus}`;
    await owner.save();

    console.log(`🔄 Owner ${owner.email} REVERTED to pending by admin ${req.user.id}`);

    res.json({
      success: true,
      message: "Owner verification reverted to pending",
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        ownerVerificationStatus: owner.ownerVerificationStatus
      }
    });
  } catch (err) {
    console.error("Revert owner error:", err);
    res.status(500).json({
      success: false,
      message: "Error reverting owner verification"
    });
  }
});

// ============================================
// 📝 REPORT MANAGEMENT
// ============================================

// @route   GET /api/admin/reports
// @desc    Get all reports with filters
// @access  Admin
router.get("/reports", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate("user", "name email isVerified isCollegeVerified")
      .populate("accommodation", "name address trustScore")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Report.countDocuments(query);

    // Get status counts
    const statusCounts = {
      pending: await Report.countDocuments({ status: "pending" }),
      ai_verified: await Report.countDocuments({ status: "ai_verified" }),
      approved: await Report.countDocuments({ status: "approved" }),
      resolved: await Report.countDocuments({ status: "resolved" }),
      verified: await Report.countDocuments({ status: "verified" }),
      disputed: await Report.countDocuments({ status: "disputed" }),
      rejected: await Report.countDocuments({ status: "rejected" })
    };

    res.json({
      success: true,
      reports,
      statusCounts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching reports"
    });
  }
});

// @route   PUT /api/admin/reports/:id/status
// @desc    Update report status (approve/reject)
// @access  Admin
router.put("/reports/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID"
      });
    }

    const validStatuses = ["pending", "ai_verified", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    report.status = status;
    if (status === "rejected" && reason) {
      report.rejectionReason = reason;
    }
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    await report.save();

    res.json({
      success: true,
      message: `Report ${status} successfully`,
      report
    });
  } catch (err) {
    console.error("Update report status error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating report status"
    });
  }
});

// @route   PUT /api/admin/reports/:id/reopen
// @desc    Reopen a disputed report for owner to resolve again
// @access  Admin
router.put("/reports/:id/reopen", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID"
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    if (report.status !== "disputed") {
      return res.status(400).json({
        success: false,
        message: "Only disputed reports can be reopened"
      });
    }

    report.status = "approved";
    report.resolution = null;
    report.reopenedBy = req.user.id;
    report.reopenedAt = new Date();
    await report.save();

    res.json({
      success: true,
      message: "Report reopened for owner to resolve",
      report
    });
  } catch (err) {
    console.error("Reopen report error:", err);
    res.status(500).json({
      success: false,
      message: "Error reopening report"
    });
  }
});

// @route   DELETE /api/admin/reports/:id
// @desc    Delete a report
// @access  Admin
router.delete("/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID"
      });
    }

    const report = await Report.findByIdAndDelete(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    res.json({
      success: true,
      message: "Report deleted successfully"
    });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting report"
    });
  }
});

// ============================================
// 📄 COUNTER REPORTS MANAGEMENT
// ============================================

// @route   GET /api/admin/counter-reports
// @desc    Get all counter reports
// @access  Admin
router.get("/counter-reports", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const counterReports = await CounterReport.find(query)
      .populate("owner", "name email")
      .populate("report", "title category status")
      .populate("accommodation", "name address")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await CounterReport.countDocuments(query);

    res.json({
      success: true,
      counterReports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error("Get counter reports error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching counter reports"
    });
  }
});

// @route   PUT /api/admin/counter-reports/:id
// @desc    Accept or reject a counter report
// @access  Admin
router.put("/counter-reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid counter report ID"
      });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'accepted' or 'rejected'"
      });
    }

    const counterReport = await CounterReport.findById(id);
    if (!counterReport) {
      return res.status(404).json({
        success: false,
        message: "Counter report not found"
      });
    }

    counterReport.status = status;
    counterReport.adminResponse = reason;
    counterReport.reviewedBy = req.user.id;
    counterReport.reviewedAt = new Date();
    await counterReport.save();

    // If accepted, update the original report status
    if (status === "accepted" && counterReport.report) {
      await Report.findByIdAndUpdate(counterReport.report, {
        status: "rejected",
        rejectionReason: "Counter evidence accepted by admin"
      });
    }

    res.json({
      success: true,
      message: `Counter report ${status}`,
      counterReport
    });
  } catch (err) {
    console.error("Update counter report error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating counter report"
    });
  }
});

// ============================================
// 🤖 AI ANALYTICS
// ============================================

// @route   GET /api/admin/ai-performance
// @desc    Get AI verification performance stats
// @access  Admin
router.get("/ai-performance", async (req, res) => {
  try {
    // Get reports with AI verification
    const totalAiVerified = await Report.countDocuments({ 
      "aiVerification.isVerified": { $exists: true } 
    });

    const aiApproved = await Report.countDocuments({ 
      "aiVerification.verdict": "VERIFIED" 
    });

    const aiRejected = await Report.countDocuments({ 
      "aiVerification.verdict": "REJECTED" 
    });

    const aiNeedsReview = await Report.countDocuments({ 
      "aiVerification.verdict": "NEEDS_REVIEW" 
    });

    // Calculate average confidence
    const confidenceAgg = await Report.aggregate([
      { $match: { "aiVerification.confidence": { $exists: true } } },
      { $group: { _id: null, avgConfidence: { $avg: "$aiVerification.confidence" } } }
    ]);

    const avgConfidence = confidenceAgg[0]?.avgConfidence || 0;

    // Auto-approved count (confidence >= 90)
    const autoApproved = await Report.countDocuments({
      "aiVerification.confidence": { $gte: 90 },
      status: "approved"
    });

    res.json({
      success: true,
      aiPerformance: {
        totalProcessed: totalAiVerified,
        verdicts: {
          verified: aiApproved,
          rejected: aiRejected,
          needsReview: aiNeedsReview
        },
        averageConfidence: Math.round(avgConfidence * 100) / 100,
        autoApproved,
        accuracy: {
          estimatedAccuracy: "85-95%",
          note: "Based on Mistral + Groq ensemble"
        }
      }
    });
  } catch (err) {
    console.error("AI performance error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching AI performance stats"
    });
  }
});

module.exports = router;```

---

## auth.js (566 lines)

```javascript
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const OTP = require("../models/OTP");
const { generateOTP, sendOTPEmail } = require("../utils/emailService");
const { checkCollegeEmail } = require("../utils/collegeVerification");

const router = express.Router();

// ✅ Configure Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs only
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto', // Handles both images and PDFs
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf']
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// @route   POST /api/auth/signup
// @desc    Register a new student
router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // 1. Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter all fields: name, email, and password are required" 
      });
    }

    // Validate name
    if (name.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: "Name must be at least 2 characters" 
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address" 
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check if user exists
    let user = await User.findOne({ email: normalizedEmail }).select('-password');
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already registered" 
      });
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ 5. Check if it's a college email
    const collegeCheck = checkCollegeEmail(normalizedEmail);
    console.log(`[SIGNUP] Email: ${normalizedEmail}, College Check:`, collegeCheck);

    // 6. Create user instance
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "student",
      isCollegeVerified: collegeCheck.isVerified,
      collegeName: collegeCheck.collegeName
    });

    // 7. Save user to MongoDB
    await newUser.save();

    // 8. Generate and send OTP
    await OTP.deleteMany({ email: normalizedEmail, type: 'verification' });
    
    const otp = generateOTP();
    const otpDoc = new OTP({
      email: normalizedEmail,
      otp,
      type: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    await otpDoc.save();

    // Send OTP email (don't block response)
    sendOTPEmail(normalizedEmail, otp, 'verification').catch(err => {
      console.error('OTP email failed:', err);
    });

    // ✅ Build response message
    let message = "Registration successful! Please check your email for the verification code.";
    if (collegeCheck.isVerified) {
      message = `Registration successful! College verified: ${collegeCheck.collegeName}. Check your email for OTP.`;
    }

    res.status(201).json({
      success: true,
      message,
      requiresVerification: true,
      email: newUser.email,
      isCollegeVerified: collegeCheck.isVerified,
      collegeName: collegeCheck.collegeName
    });
  } catch (err) {
    console.error("Signup error:", err);
    
    // Handle MongoDB Duplicate Key Error (11000)
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: err.message || "Server error during registration" 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user & get token
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please enter all fields" 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support."
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Check if email is verified (only for students)
    if (user.role === 'student' && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your email is not verified. Please verify your email to login.",
        requiresVerification: true,
        email: user.email
      });
    }

    // ✅ Generate JWT payload with ownerVerificationStatus included
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isCollegeVerified: user.isCollegeVerified,
        collegeName: user.collegeName,
        ownerVerificationStatus: user.ownerVerificationStatus || null // ✅ IMPORTANT: Include this!
      },
    };

    // ✅ Check owner verification status and include in response
    if (user.role === 'owner' && user.ownerVerificationStatus !== 'verified') {
      // Owner is not verified - still generate token but flag it
      jwt.sign(
        payload,
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "7d" },
        (err, token) => {
          if (err) throw err;
          return res.json({
            success: true,
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              profilePhoto: user.profilePhoto,
              ownerVerificationStatus: user.ownerVerificationStatus,
              verificationSubmittedAt: user.verificationSubmittedAt,
              rejectionReason: user.rejectionReason,
              propertyName: user.propertyName,
              propertyCount: user.propertyCount
            },
            requiresVerification: true, // ✅ Flag for frontend to show pending page
            verificationStatus: user.ownerVerificationStatus
          });
        }
      );
      return; // Important: exit early
    }

    // ✅ Normal login flow (verified owner or student)
    jwt.sign(
      payload,
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isCollegeVerified: user.isCollegeVerified,
            collegeName: user.collegeName,
            profilePhoto: user.profilePhoto,
            ownerVerificationStatus: user.ownerVerificationStatus,
            propertyName: user.propertyName,
            propertyCount: user.propertyCount
          },
        });
      }
    );
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// @route   POST /api/auth/register-owner
// @desc    Register a new property owner WITH DOCUMENTS
router.post("/register-owner", upload.fields([
  { name: 'governmentId', maxCount: 1 },
  { name: 'propertyProof', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 }
]), async (req, res) => {
  const { name, email, password, propertyName, propertyCount, phone, businessAddress, gstNumber } = req.body;

  try {
    // 1. Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter all required fields" 
      });
    }

    // ✅ Validate documents
    if (!req.files || !req.files.governmentId || !req.files.propertyProof) {
      return res.status(400).json({
        success: false,
        message: "Please upload Government ID and Property Proof documents"
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email address" 
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check if user exists
    let existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already registered" 
      });
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ 5. Upload documents to Cloudinary
    console.log('Uploading documents to Cloudinary...');
    
    const governmentIdUpload = await uploadToCloudinary(
      req.files.governmentId[0].buffer,
      'owner-verification/government-ids'
    );

    const propertyProofUpload = await uploadToCloudinary(
      req.files.propertyProof[0].buffer,
      'owner-verification/property-proofs'
    );

    let businessRegistrationUpload = null;
    if (req.files.businessRegistration) {
      businessRegistrationUpload = await uploadToCloudinary(
        req.files.businessRegistration[0].buffer,
        'owner-verification/business-registrations'
      );
    }

    // 6. Create owner user with documents
    const newOwner = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "owner",
      phone: phone || null,
      businessAddress: businessAddress || null,
      gstNumber: gstNumber || null,
      propertyName: propertyName || null,
      propertyCount: propertyCount || null,
      
      // ✅ Set verification status to pending
      isVerified: false,
      ownerVerificationStatus: 'pending',
      
      // ✅ Store verification documents
      verificationDocuments: {
        governmentId: {
          url: governmentIdUpload.secure_url,
          publicId: governmentIdUpload.public_id,
          uploadedAt: new Date()
        },
        propertyProof: {
          url: propertyProofUpload.secure_url,
          publicId: propertyProofUpload.public_id,
          uploadedAt: new Date()
        },
        businessRegistration: businessRegistrationUpload ? {
          url: businessRegistrationUpload.secure_url,
          publicId: businessRegistrationUpload.public_id,
          uploadedAt: new Date()
        } : undefined
      },
      
      verificationSubmittedAt: new Date()
    });

    // 7. Save owner to MongoDB
    await newOwner.save();

    console.log(`✅ Owner registered: ${newOwner.email}, Status: ${newOwner.ownerVerificationStatus}`);

    // 8. Generate JWT token with ownerVerificationStatus
    const payload = {
      user: {
        id: newOwner.id,
        name: newOwner.name,
        email: newOwner.email,
        role: newOwner.role,
        ownerVerificationStatus: newOwner.ownerVerificationStatus // ✅ Include in JWT
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "7d" },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return res.status(500).json({ 
            success: false, 
            message: "Error generating authentication token" 
          });
        }

        // 9. Return success with token and pending status
        res.status(201).json({
          success: true,
          message: "Registration successful! Your documents are under review. You'll be notified within 24-48 hours.",
          token,
          user: {
            id: newOwner.id,
            name: newOwner.name,
            email: newOwner.email,
            role: newOwner.role,
            ownerVerificationStatus: newOwner.ownerVerificationStatus,
            verificationSubmittedAt: newOwner.verificationSubmittedAt,
            propertyName: newOwner.propertyName,
            propertyCount: newOwner.propertyCount
          },
          requiresVerification: true,
          verificationStatus: 'pending'
        });
      }
    );
  } catch (err) {
    console.error("Owner registration error:", err);
    
    // Handle MongoDB Duplicate Key Error
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: err.message || "Server error during registration" 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user info (from token)
router.get("/me", require("../middleware/authMiddleware"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isCollegeVerified: user.isCollegeVerified,
        collegeName: user.collegeName,
        profilePhoto: user.profilePhoto,
        ownerVerificationStatus: user.ownerVerificationStatus,
        verificationSubmittedAt: user.verificationSubmittedAt,
        rejectionReason: user.rejectionReason,
        propertyName: user.propertyName,
        propertyCount: user.propertyCount,
        phone: user.phone,
        businessAddress: user.businessAddress,
        gstNumber: user.gstNumber,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// @route   GET /api/auth/owner/verification-status
// @desc    Get owner verification status (for frontend polling)
router.get("/owner/verification-status", require("../middleware/authMiddleware"), async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: "Owner access required"
      });
    }

    const owner = await User.findById(req.user.id).select(
      'ownerVerificationStatus verificationSubmittedAt verificationReviewedAt rejectionReason'
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found"
      });
    }

    res.json({
      success: true,
      verificationStatus: owner.ownerVerificationStatus,
      submittedAt: owner.verificationSubmittedAt,
      reviewedAt: owner.verificationReviewedAt,
      rejectionReason: owner.rejectionReason,
      isVerified: owner.ownerVerificationStatus === 'verified'
    });
  } catch (err) {
    console.error("Get verification status error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;```

---

## server.js (2326 lines)

```javascript
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require("cors");
const path = require("path");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models
const Report = require("./models/Report");
const User = require('./models/User');
const Accommodation = require('./models/Accommodation');
const CounterReport = require('./models/CounterReport');
const OTP = require('./models/OTP');

// Routes & Middleware
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require('./middleware/adminMiddleware');
const ownerMiddleware = require('./middleware/ownerMiddleware');

// Utils
const { generateOTP, sendOTPEmail } = require('./utils/emailService');
const { cloudinary, upload } = require('./config/cloudinary');
const { updateAccommodationScore } = require('./utils/trustScore');

// ✅ AI Verification Import
let verifyReportImage;
try {
  const aiModule = require('./utils/aiVerification');
  verifyReportImage = aiModule.verifyReportImage;
  console.log('[AI Verification] Module loaded successfully');
} catch (err) {
  console.warn('[AI Verification] Module not loaded:', err.message);
  verifyReportImage = null;
}

// Helper function to escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const app = express();

// ============================================================
// SECURITY & MIDDLEWARE
// ============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/register-owner', authLimiter);
app.use('/api/profile/password', authLimiter);
app.use('/api/', apiLimiter);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/auth", authRoutes);

// ============================================================
// BASIC ROUTES
// ============================================================

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend API working" });
});

// ============================================================
// IMAGE UPLOAD ROUTES
// ============================================================

app.post('/api/upload', authMiddleware, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadedImages = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploadedImages
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ success: false, message: 'Error uploading images', error: error.message });
  }
});

app.delete('/api/upload/:publicId', authMiddleware, async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      return res.status(400).json({ success: false, message: 'Error deleting image from cloud' });
    }

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting image', error: error.message });
  }
});

// ============================================================
// REPORT ROUTES
// ============================================================

// Get user's reports (paginated)
app.get('/api/reports/my-reports', authMiddleware, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const userReports = await Report.find({ user: req.user.id })
      .select('accommodationName accommodation issueType description images createdAt status upvotes upvotedBy user resolution verification aiVerification')
      .populate('accommodation', 'name address city')
      .populate('resolution.resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Report.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      count: userReports.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: userReports
    });
  } catch (error) {
    console.error('MY REPORTS ERROR:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching your reports',
      error: error.message
    });
  }
});

// Get all reports (public)
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('accommodation', 'name address city')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error("FETCH ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ POST new report — ONLY COLLEGE VERIFIED STUDENTS + AI VERIFICATION
app.post('/api/reports', authMiddleware, async (req, res) => {
  try {
    // ========================================
    // STEP 1: GET USER AND VERIFY
    // ========================================
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('[Report] ❌ User not found:', req.user.id);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Debug logging
    console.log('========================================');
    console.log('[Report] User:', user.email);
    console.log('[Report] Role:', user.role);
    console.log('[Report] isCollegeVerified:', user.isCollegeVerified);
    console.log('[Report] collegeName:', user.collegeName);
    console.log('[Report] isBanned:', user.isBanned);
    console.log('========================================');

    // Check if banned
    if (user.isBanned === true) {
      console.log('[Report] ❌ BLOCKED - User is banned');
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been suspended. Please contact support.' 
      });
    }

    // Check if student
    if (user.role !== 'student') {
      console.log('[Report] ❌ BLOCKED - Not a student, role:', user.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Only students can submit safety reports' 
      });
    }

    // ========================================
    // ✅ CRITICAL: CHECK COLLEGE VERIFICATION ONLY
    // ========================================
    const isCollegeVerified = user.isCollegeVerified === true;

    console.log('[Report] College Verified:', isCollegeVerified);

    if (!isCollegeVerified) {
      console.log('[Report] ❌ BLOCKED - College not verified');
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your college email before submitting reports. Only verified college students can report safety issues.',
        requiresVerification: true,
        requiresCollegeVerification: true,
        userEmail: user.email
      });
    }

    console.log('[Report] ✅ College verified, proceeding...');

    // ========================================
    // STEP 2: VALIDATE REQUEST DATA
    // ========================================
    const { accommodation, accommodationName, issueType, description, images } = req.body;

    if (!accommodation && (!accommodationName || !accommodationName.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please select or enter an accommodation name' 
      });
    }

    if (!issueType || !issueType.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Issue type is required' 
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Description is required' 
      });
    }

    const validIssueTypes = ['Food Safety', 'Water Quality', 'Hygiene', 'Security', 'Infrastructure'];
    if (!validIssueTypes.includes(issueType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid issue type' 
      });
    }

    if (description.length > 2000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Description cannot exceed 2000 characters' 
      });
    }

    // Validate images
    let validatedImages = [];
    if (images && Array.isArray(images)) {
      validatedImages = images.filter(img => img && img.url && img.publicId);
    }

    // ========================================
    // STEP 3: RESOLVE ACCOMMODATION
    // ========================================
    let accommodationId = null;
    let resolvedAccommodationName = accommodationName || '';

    if (accommodation) {
      if (!mongoose.Types.ObjectId.isValid(accommodation)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid accommodation ID' 
        });
      }
      const accommodationDoc = await Accommodation.findById(accommodation);
      if (!accommodationDoc) {
        return res.status(404).json({ 
          success: false, 
          message: 'Selected accommodation not found. Please choose a registered accommodation.' 
        });
      }
      accommodationId = accommodationDoc._id;
      resolvedAccommodationName = accommodationDoc.name;
    }

    // ========================================
    // STEP 4: AI VERIFICATION
    // ========================================
    let aiVerificationData = null;
    let autoStatus = 'pending';

    if (verifyReportImage && validatedImages.length > 0 && validatedImages[0].url) {
      try {
        console.log('[Report] Running AI verification...');
        console.log('[Report] User:', user.name, '| College:', user.collegeName);
        console.log('[Report] Image URL:', validatedImages[0].url);
        console.log('[Report] Issue Type:', issueType);
        
        const aiResult = await verifyReportImage(validatedImages[0].url, issueType);
        
        console.log('[Report] AI Verdict:', aiResult.verdict);
        console.log('[Report] AI Confidence:', aiResult.confidence);

        aiVerificationData = {
          verdict: aiResult.verdict,
          severity: aiResult.severity,
          confidence: aiResult.confidence,
          summary: aiResult.summary,
          recommendAdminReview: aiResult.recommendAdminReview || false,
          details: aiResult.details || null,
          timestamp: new Date()
        };

        // Auto-reject if AI says image is clearly irrelevant
        if (aiResult.verdict === 'REJECTED' && aiResult.confidence >= 0.7) {
          autoStatus = 'rejected';
          console.log('[Report] Auto-rejected by AI');
        }

        // Mark for admin review if AI is unsure or high severity
        if (aiResult.verdict === 'NEEDS_REVIEW' || aiResult.severity === 'high') {
          aiVerificationData.recommendAdminReview = true;
        }

      } catch (aiError) {
        console.error('[Report] AI Verification Error:', aiError.message);
        aiVerificationData = {
          verdict: 'NEEDS_REVIEW',
          severity: 'unknown',
          confidence: 0,
          summary: 'AI verification failed - manual review required',
          recommendAdminReview: true,
          details: { error: aiError.message },
          timestamp: new Date()
        };
      }
    } else if (!verifyReportImage) {
      console.log('[Report] AI verification not available, skipping...');
    } else {
      console.log('[Report] No images provided, skipping AI verification');
    }

    // ========================================
    // STEP 5: CREATE REPORT
    // ========================================
    const newReport = new Report({
      accommodationName: resolvedAccommodationName,
      accommodation: accommodationId,
      issueType,
      description,
      images: validatedImages,
      user: req.user.id,
      status: autoStatus,
      aiVerification: aiVerificationData
    });

    const saved = await newReport.save();

    // Update trust score
    if (accommodationId && autoStatus !== 'rejected') {
      await updateAccommodationScore(Accommodation, Report, accommodationId);
    }

    // Build response message
    let responseMessage = 'Report submitted successfully';
    if (autoStatus === 'rejected') {
      responseMessage = 'Report submitted but flagged by AI as potentially irrelevant. Admin will review.';
    } else if (aiVerificationData?.recommendAdminReview) {
      responseMessage = 'Report submitted successfully. Marked for admin review.';
    } else if (aiVerificationData?.verdict === 'VERIFIED') {
      responseMessage = 'Report submitted and verified by AI. Awaiting final approval.';
    }

    console.log(`[Report] ✅ Success - User: ${user.name} (${user.collegeName}), Status: ${autoStatus}, AI: ${aiVerificationData?.verdict || 'N/A'}`);

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: saved,
      aiVerification: aiVerificationData ? {
        verdict: aiVerificationData.verdict,
        severity: aiVerificationData.severity,
        confidence: aiVerificationData.confidence,
        summary: aiVerificationData.summary
      } : null
    });
  } catch (error) {
    console.error('[Report] ❌ SAVE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving report',
      error: error.message
    });
  }
});

// UPDATE report
app.put('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { accommodation, accommodationName, issueType, description, images } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own reports' });
    }

    if (accommodation) {
      if (!mongoose.Types.ObjectId.isValid(accommodation)) {
        return res.status(400).json({ success: false, message: 'Invalid accommodation ID' });
      }
      const accommodationDoc = await Accommodation.findById(accommodation);
      if (!accommodationDoc) {
        return res.status(404).json({ success: false, message: 'Selected accommodation not found' });
      }
      report.accommodation = accommodationDoc._id;
      report.accommodationName = accommodationDoc.name;
    } else if (accommodationName) {
      report.accommodationName = accommodationName;
    }

    if (issueType) report.issueType = issueType;
    if (description) report.description = description;
    if (images !== undefined) report.images = images;

    // Re-run AI verification if images changed
    if (images !== undefined && verifyReportImage && images.length > 0 && images[0].url) {
      try {
        console.log('[Report Update] Re-running AI verification...');
        const aiResult = await verifyReportImage(images[0].url, report.issueType);
        
        report.aiVerification = {
          verdict: aiResult.verdict,
          severity: aiResult.severity,
          confidence: aiResult.confidence,
          summary: aiResult.summary,
          recommendAdminReview: aiResult.recommendAdminReview || false,
          details: aiResult.details || null,
          timestamp: new Date()
        };

        report.status = 'pending';
      } catch (aiError) {
        console.error('[Report Update] AI Verification Error:', aiError.message);
      }
    }

    const updated = await report.save();

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('UPDATE ERROR:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
});

// DELETE report
app.delete('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reports' });
    }

    const accommodationId = report.accommodation;
    await Report.findByIdAndDelete(id);

    if (accommodationId) {
      await updateAccommodationScore(Accommodation, Report, accommodationId);
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting report', error: error.message });
  }
});

// UPVOTE report
app.post('/api/reports/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const reportId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const userId = req.user.id;
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot upvote your own report' });
    }

    const alreadyUpvoted = report.upvotedBy.some(id => id.toString() === userId);

    if (alreadyUpvoted) {
      report.upvotedBy = report.upvotedBy.filter(id => id.toString() !== userId);
      report.upvotes = Math.max(0, report.upvotes - 1);
    } else {
      report.upvotedBy.push(userId);
      report.upvotes += 1;
    }

    await report.save();

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({
      success: true,
      data: {
        upvotes: report.upvotes,
        hasUpvoted: !alreadyUpvoted
      }
    });
  } catch (error) {
    console.error('UPVOTE ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error processing upvote' });
  }
});

// Verify/Dispute resolution
app.put('/api/reports/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { accepted, feedback, disputeReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the original reporter can verify the fix' });
    }

    if (report.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Report must be in resolved status to verify' });
    }

    if (accepted) {
      report.status = 'verified';
      report.verification = {
        isVerified: true,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        feedback: feedback || ''
      };
    } else {
      if (!disputeReason || !disputeReason.trim()) {
        return res.status(400).json({ success: false, message: 'Dispute reason is required' });
      }
      report.status = 'disputed';
      report.verification = {
        isDisputed: true,
        disputeReason: disputeReason.trim(),
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      };
    }

    await report.save();

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({ success: true, message: accepted ? 'Resolution verified' : 'Resolution disputed', data: report });
  } catch (error) {
    console.error('VERIFY ERROR:', error);
    res.status(500).json({ success: false, message: 'Error verifying report', error: error.message });
  }
});

// Get resolution details
app.get('/api/reports/:id/resolution', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id)
      .populate('resolution.resolvedBy', 'name')
      .populate('user', 'name')
      .lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('GET RESOLUTION ERROR:', error);
    res.status(500).json({ success: false, message: 'Error fetching resolution details' });
  }
});

// ============================================================
// AI VERIFICATION TEST ENDPOINT
// ============================================================

app.post('/api/test-ai-verification', authMiddleware, async (req, res) => {
  try {
    const { imageUrl, issueType } = req.body;

    if (!imageUrl || !issueType) {
      return res.status(400).json({ 
        success: false, 
        message: 'imageUrl and issueType are required' 
      });
    }

    if (!verifyReportImage) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI verification module not available. Check API keys in .env' 
      });
    }

    const result = await verifyReportImage(imageUrl, issueType);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI Test Error:', error);
    res.status(500).json({
      success: false,
      message: 'AI verification test failed',
      error: error.message
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

// Admin stats with AI analytics
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAccommodations = await Accommodation.countDocuments();
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const collegeVerifiedStudents = await User.countDocuments({ role: 'student', isCollegeVerified: true });
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    // ✅ Owner verification stats
    const pendingOwners = await User.countDocuments({ role: 'owner', ownerVerificationStatus: 'pending' });
    const verifiedOwners = await User.countDocuments({ role: 'owner', ownerVerificationStatus: 'verified' });
    const rejectedOwners = await User.countDocuments({ role: 'owner', ownerVerificationStatus: 'rejected' });

    // AI Verification Statistics
    const aiStats = await Report.aggregate([
      {
        $facet: {
          total: [
            { $match: { 'aiVerification': { $exists: true, $ne: null } } },
            { $count: 'count' }
          ],
          verified: [
            { $match: { 'aiVerification.verdict': 'VERIFIED' } },
            { $count: 'count' }
          ],
          rejected: [
            { $match: { 'aiVerification.verdict': 'REJECTED' } },
            { $count: 'count' }
          ],
          needsReview: [
            { $match: { 'aiVerification.verdict': 'NEEDS_REVIEW' } },
            { $count: 'count' }
          ],
          avgConfidence: [
            { $match: { 'aiVerification.confidence': { $exists: true } } },
            { $group: { _id: null, avg: { $avg: '$aiVerification.confidence' } } }
          ]
        }
      }
    ]);

    const aiStatsData = aiStats[0];

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAccommodations,
        totalReports,
        pendingReports,
        collegeVerifiedStudents,
        totalStudents,
        verificationRate: totalStudents > 0 ? Math.round((collegeVerifiedStudents / totalStudents) * 100) : 0,
        // ✅ Owner verification stats
        ownerStats: {
          pending: pendingOwners,
          verified: verifiedOwners,
          rejected: rejectedOwners,
          total: pendingOwners + verifiedOwners + rejectedOwners
        },
        aiStats: {
          totalWithAI: aiStatsData.total[0]?.count || 0,
          verified: aiStatsData.verified[0]?.count || 0,
          rejected: aiStatsData.rejected[0]?.count || 0,
          needsReview: aiStatsData.needsReview[0]?.count || 0,
          avgConfidence: aiStatsData.avgConfidence[0]?.avg || 0
        }
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

// Get all reports for admin with populated data
app.get('/api/admin/reports', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { aiFilter, status } = req.query;

    let query = {};

    if (aiFilter === 'needs-review') {
      query['aiVerification.recommendAdminReview'] = true;
    } else if (aiFilter === 'ai-verified') {
      query['aiVerification.verdict'] = 'VERIFIED';
    } else if (aiFilter === 'ai-rejected') {
      query['aiVerification.verdict'] = 'REJECTED';
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('user', 'name email isCollegeVerified collegeName isVerified')
      .populate('accommodation', 'name address city')
      .populate('resolution.resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Transform reports to match frontend expectations
    const transformedReports = reports.map(report => {
      let userData = null;
      if (report.user && typeof report.user === 'object') {
        userData = {
          _id: report.user._id,
          name: report.user.name || 'Unknown',
          email: report.user.email || 'N/A',
          isCollegeVerified: report.user.isCollegeVerified || false,
          isVerified: report.user.isVerified || false,
          collegeName: report.user.collegeName || null
        };
      }

      let accommodationData = null;
      if (report.accommodation && typeof report.accommodation === 'object') {
        accommodationData = {
          _id: report.accommodation._id,
          name: report.accommodation.name || report.accommodationName || 'N/A',
          address: report.accommodation.address || 'N/A',
          city: report.accommodation.city || ''
        };
      } else if (report.accommodationName) {
        accommodationData = {
          _id: null,
          name: report.accommodationName,
          address: 'N/A',
          city: ''
        };
      }

      return {
        _id: report._id,
        category: report.category || report.issueType || 'Unknown',
        issueType: report.issueType || report.category || 'Unknown',
        description: report.description || '',
        status: report.status || 'pending',
        createdAt: report.createdAt,
        images: report.images || [],
        upvotes: report.upvotes || 0,
        aiVerification: report.aiVerification || null,
        resolution: report.resolution || null,
        verification: report.verification || null,
        userId: userData || { _id: null, name: 'Unknown User', email: 'N/A' },
        accommodationId: accommodationData || { _id: null, name: 'N/A', address: 'N/A' },
        user: userData,
        accommodation: accommodationData,
        accommodationName: report.accommodationName || accommodationData?.name || 'N/A'
      };
    });

    console.log(`[Admin Reports] Found ${reports.length} reports`);

    res.json({ success: true, data: transformedReports });
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
});

// Update report status
app.put('/api/admin/reports/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
    .populate('user', 'name email')
    .populate('accommodation', 'name address');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation._id);
    }

    res.json({ success: true, message: `Report ${status}`, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating report', error: error.message });
  }
});

// Delete report (admin)
app.delete('/api/admin/reports/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting report', error: error.message });
  }
});

// Get all users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
});

// Ban/Unban user
app.put('/api/admin/users/:id/ban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isBanned },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: isBanned ? 'User banned successfully' : 'User unbanned successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
});

// Get counter reports
app.get('/api/admin/counter-reports', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const counterReports = await CounterReport.find()
      .populate('originalReport')
      .populate('accommodation', 'name')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: counterReports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching counter reports', error: error.message });
  }
});

// Review counter report
app.put('/api/admin/counter-reports/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid counter report ID' });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const counterReport = await CounterReport.findByIdAndUpdate(
      id,
      { status, adminNotes, reviewedAt: new Date() },
      { new: true }
    );

    if (!counterReport) {
      return res.status(404).json({ success: false, message: 'Counter report not found' });
    }

    await Report.findByIdAndUpdate(counterReport.originalReport, {
      counterStatus: status,
      status: status === 'accepted' ? 'rejected' : undefined
    });

    res.json({ success: true, message: `Counter report ${status}`, data: counterReport });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reviewing counter report', error: error.message });
  }
});

// Reopen disputed report
app.put('/api/admin/reports/:id/reopen', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Only disputed reports can be reopened' });
    }

    report.status = 'approved';
    report.resolution = {
      description: '',
      actionTaken: '',
      images: [],
      resolvedBy: null,
      resolvedAt: null
    };
    report.verification = {
      isVerified: false,
      isDisputed: false,
      verifiedBy: null,
      verifiedAt: null,
      feedback: '',
      disputeReason: ''
    };

    await report.save();

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({ success: true, message: 'Report reopened for owner', data: report });
  } catch (error) {
    console.error('REOPEN ERROR:', error);
    res.status(500).json({ success: false, message: 'Error reopening report', error: error.message });
  }
});

// AI performance analytics
app.get('/api/admin/ai-performance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const aiPerformance = await Report.aggregate([
      { $match: { 'aiVerification': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$aiVerification.verdict',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$aiVerification.confidence' },
          highSeverity: {
            $sum: { $cond: [{ $eq: ['$aiVerification.severity', 'high'] }, 1, 0] }
          },
          mediumSeverity: {
            $sum: { $cond: [{ $eq: ['$aiVerification.severity', 'medium'] }, 1, 0] }
          },
          lowSeverity: {
            $sum: { $cond: [{ $eq: ['$aiVerification.severity', 'low'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({ success: true, data: aiPerformance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching AI performance', error: error.message });
  }
});

// ============================================================
// OWNER VERIFICATION ROUTES (NEW!)
// ============================================================

// Get pending owners (Admin only)
app.get('/api/admin/pending-owners', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingOwners = await User.find({
      role: 'owner',
      ownerVerificationStatus: { $in: ['pending', 'under_review'] }
    })
    .select('-password')
    .sort({ verificationSubmittedAt: -1 })
    .lean();

    console.log(`[Admin] Found ${pendingOwners.length} pending owners`);

    res.json({
      success: true,
      data: pendingOwners
    });
  } catch (error) {
    console.error('Get pending owners error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending owners',
      error: error.message
    });
  }
});

// Approve owner verification (Admin only)
app.put('/api/admin/verify-owner/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid owner ID'
      });
    }

    const owner = await User.findById(id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    if (owner.role !== 'owner') {
      return res.status(400).json({
        success: false,
        message: 'User is not an owner'
      });
    }

    // Update verification status
    owner.ownerVerificationStatus = 'verified';
    owner.isVerified = true;
    owner.verificationReviewedAt = new Date();
    owner.verifiedBy = req.user.id;
    owner.rejectionReason = null;

    await owner.save();

    console.log(`✅ [Admin] Owner ${owner.email} verified by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Owner verification approved successfully',
      data: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        ownerVerificationStatus: owner.ownerVerificationStatus,
        verificationReviewedAt: owner.verificationReviewedAt
      }
    });
  } catch (error) {
    console.error('Verify owner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying owner',
      error: error.message
    });
  }
});

// Reject owner verification (Admin only)
app.put('/api/admin/reject-owner/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid owner ID'
      });
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const owner = await User.findById(id);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    if (owner.role !== 'owner') {
      return res.status(400).json({
        success: false,
        message: 'User is not an owner'
      });
    }

    // Update verification status
    owner.ownerVerificationStatus = 'rejected';
    owner.isVerified = false;
    owner.verificationReviewedAt = new Date();
    owner.verifiedBy = req.user.id;
    owner.rejectionReason = rejectionReason.trim();

    await owner.save();

    console.log(`❌ [Admin] Owner ${owner.email} rejected: ${rejectionReason}`);

    res.json({
      success: true,
      message: 'Owner verification rejected',
      data: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        ownerVerificationStatus: owner.ownerVerificationStatus,
        rejectionReason: owner.rejectionReason,
        verificationReviewedAt: owner.verificationReviewedAt
      }
    });
  } catch (error) {
    console.error('Reject owner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting owner',
      error: error.message
    });
  }
});

// Get owner verification status (Owner can check their own status)
app.get('/api/owner/verification-status', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const owner = await User.findById(req.user.id)
      .select('ownerVerificationStatus verificationSubmittedAt verificationReviewedAt rejectionReason verificationDocuments')
      .lean();

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: owner.ownerVerificationStatus,
        submittedAt: owner.verificationSubmittedAt,
        reviewedAt: owner.verificationReviewedAt,
        rejectionReason: owner.rejectionReason,
        documentsUploaded: {
          governmentId: !!owner.verificationDocuments?.governmentId?.url,
          propertyProof: !!owner.verificationDocuments?.propertyProof?.url,
          businessRegistration: !!owner.verificationDocuments?.businessRegistration?.url
        }
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification status',
      error: error.message
    });
  }
});

// ============================================================
// OWNER ROUTES
// ============================================================

// Owner stats
app.get('/api/owner/stats', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ owner: req.user.id });

    const totalAccommodations = accommodations.length;
    const totalRooms = accommodations.reduce((sum, a) => sum + a.totalRooms, 0);
    const occupiedRooms = accommodations.reduce((sum, a) => sum + a.occupiedRooms, 0);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const accommodationIds = accommodations.map(a => a._id);
    const totalReports = await Report.countDocuments({
      accommodation: { $in: accommodationIds }
    });
    const pendingCounters = await CounterReport.countDocuments({
      owner: req.user.id,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        totalAccommodations,
        totalRooms,
        occupiedRooms,
        occupancyRate,
        totalReports,
        pendingCounters
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

// Get owner's accommodations
app.get('/api/owner/accommodations', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ owner: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: accommodations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching accommodations', error: error.message });
  }
});

// Add accommodation
app.post('/api/owner/accommodations', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { name, address, city, description, amenities, totalRooms, pricePerMonth, contactPhone, latitude, longitude } = req.body;

    const parsedLat = latitude ? parseFloat(latitude) : null;
    const parsedLng = longitude ? parseFloat(longitude) : null;
    const validLat = parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null;
    const validLng = parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null;

    const newAccommodation = new Accommodation({
      name,
      address,
      city,
      description,
      amenities: amenities || [],
      totalRooms,
      pricePerMonth,
      contactPhone,
      owner: req.user.id,
      latitude: validLat,
      longitude: validLng,
      location: validLat && validLng ? {
        type: 'Point',
        coordinates: [validLng, validLat]
      } : undefined
    });

    const saved = await newAccommodation.save();
    res.status(201).json({ success: true, message: 'Accommodation added successfully', data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding accommodation', error: error.message });
  }
});

// Update accommodation
app.put('/api/owner/accommodations/:id', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    if (accommodation.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
      const parsedLat = req.body.latitude ? parseFloat(req.body.latitude) : null;
      const parsedLng = req.body.longitude ? parseFloat(req.body.longitude) : null;
      req.body.latitude = parsedLat !== null && !isNaN(parsedLat) ? parsedLat : null;
      req.body.longitude = parsedLng !== null && !isNaN(parsedLng) ? parsedLng : null;

      if (req.body.latitude && req.body.longitude) {
        req.body.location = {
          type: 'Point',
          coordinates: [req.body.longitude, req.body.latitude]
        };
      }
    }

    const updated = await Accommodation.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, message: 'Accommodation updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating accommodation', error: error.message });
  }
});

// Delete accommodation
app.delete('/api/owner/accommodations/:id', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    if (accommodation.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Accommodation.findByIdAndDelete(id);
    res.json({ success: true, message: 'Accommodation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting accommodation', error: error.message });
  }
});

// Get owner's reports
app.get('/api/owner/reports', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ owner: req.user.id }).lean();
    const accommodationIds = accommodations.map(a => a._id);

    const reports = await Report.find({
      $or: [
        { accommodation: { $in: accommodationIds } },
        { accommodationName: { $in: accommodations.map(a => a.name) } }
      ]
    })
    .populate('user', 'name email isCollegeVerified collegeName')
    .populate('accommodation', 'name address city')
    .sort({ createdAt: -1 })
    .lean();

    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
});

// Resolve report
app.put('/api/owner/reports/:id/resolve', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const { description, actionTaken, images } = req.body;

    if (!description || description.length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters' });
    }
    if (!actionTaken) {
      return res.status(400).json({ success: false, message: 'Action taken is required' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    let accommodation = null;
    if (report.accommodation) {
      accommodation = await Accommodation.findOne({ _id: report.accommodation, owner: req.user.id });
    }
    if (!accommodation) {
      accommodation = await Accommodation.findOne({ name: report.accommodationName, owner: req.user.id });
    }

    if (!accommodation) {
      return res.status(403).json({ success: false, message: 'Not authorized to resolve this report' });
    }

    if (report.status !== 'approved' && report.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Can only resolve approved or disputed reports' });
    }

    report.status = 'resolved';
    report.resolution = {
      description,
      actionTaken,
      images: images || [],
      resolvedBy: req.user.id,
      resolvedAt: new Date()
    };

    await report.save();

    if (report.accommodation) {
      await updateAccommodationScore(Accommodation, Report, report.accommodation);
    }

    res.json({ success: true, message: 'Report resolved successfully', data: report });
  } catch (error) {
    console.error('RESOLVE ERROR:', error);
    res.status(500).json({ success: false, message: 'Error resolving report', error: error.message });
  }
});

// Submit counter report
app.post('/api/owner/counter-report', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { reportId, reason, explanation, evidenceUrls, evidenceDescription } = req.body;

    const originalReport = await Report.findById(reportId);
    if (!originalReport) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    let accommodation = null;
    if (originalReport.accommodation) {
      accommodation = await Accommodation.findOne({
        _id: originalReport.accommodation,
        owner: req.user.id
      });
    }
    if (!accommodation) {
      accommodation = await Accommodation.findOne({
        name: originalReport.accommodationName,
        owner: req.user.id
      });
    }

    if (!accommodation) {
      return res.status(403).json({ success: false, message: 'Not authorized to counter this report' });
    }

    const existingCounter = await CounterReport.findOne({ originalReport: reportId });
    if (existingCounter) {
      return res.status(400).json({ success: false, message: 'Counter report already submitted for this report' });
    }

    const counterReport = new CounterReport({
      originalReport: reportId,
      accommodation: accommodation._id,
      owner: req.user.id,
      reason,
      explanation,
      evidenceUrls: evidenceUrls || [],
      evidenceDescription
    });

    await counterReport.save();

    await Report.findByIdAndUpdate(reportId, {
      isCountered: true,
      counterStatus: 'pending'
    });

    res.status(201).json({ success: true, message: 'Counter report submitted successfully', data: counterReport });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting counter report', error: error.message });
  }
});

// Get owner's counter reports
app.get('/api/owner/counter-reports', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const counterReports = await CounterReport.find({ owner: req.user.id })
      .populate('originalReport')
      .populate('accommodation', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: counterReports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching counter reports', error: error.message });
  }
});

// Update occupancy
app.put('/api/owner/accommodations/:id/occupancy', authMiddleware, ownerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const { occupiedRooms } = req.body;

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    if (accommodation.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (occupiedRooms > accommodation.totalRooms) {
      return res.status(400).json({ success: false, message: 'Occupied rooms cannot exceed total rooms' });
    }

    accommodation.occupiedRooms = occupiedRooms;
    await accommodation.save();

    res.json({ success: true, message: 'Occupancy updated', data: accommodation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating occupancy', error: error.message });
  }
});

// ============================================================
// PROFILE ROUTES
// ============================================================

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let stats = {};

    if (user.role === 'student') {
      const totalReports = await Report.countDocuments({ user: req.user.id });
      
      const upvoteResult = await Report.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: null, totalUpvotes: { $sum: '$upvotes' } } }
      ]);
      
      const totalUpvotes = upvoteResult.length > 0 ? upvoteResult[0].totalUpvotes : 0;
      
      const resolvedReports = await Report.countDocuments({ 
        user: req.user.id, 
        status: 'verified' 
      });

      stats = {
        totalReports,
        totalUpvotes,
        resolvedReports
      };
    } else if (user.role === 'owner') {
      const accommodations = await Accommodation.find({ owner: req.user.id }).lean();
      const totalProperties = accommodations.length;
      
      const avgTrustScore = accommodations.length > 0
        ? Math.round(accommodations.reduce((sum, a) => sum + (a.trustScore || 0), 0) / accommodations.length)
        : 0;
      
      const accommodationIds = accommodations.map(a => a._id);
      const totalReportsOnProperties = await Report.countDocuments({
        accommodation: { $in: accommodationIds }
      });
      
      const resolvedCount = await Report.countDocuments({
        accommodation: { $in: accommodationIds },
        status: { $in: ['resolved', 'verified'] }
      });
      
      const resolutionRate = totalReportsOnProperties > 0
        ? Math.round((resolvedCount / totalReportsOnProperties) * 100)
        : 0;

      stats = {
        totalProperties,
        avgTrustScore,
        totalReportsOnProperties,
        resolutionRate
      };
    }

    res.json({
      success: true,
      data: {
        ...user,
        ...stats
      }
    });
  } catch (error) {
    console.error('PROFILE ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { name, profilePhoto } = req.body;

    if (profilePhoto !== undefined) {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profilePhoto },
        { new: true }
      ).select('-password');
      
      return res.json({ success: true, data: user });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({ success: false, message: 'Name cannot exceed 50 characters' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('PROFILE UPDATE ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

app.put('/api/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('PASSWORD CHANGE ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
});

app.put('/api/profile/notifications', authMiddleware, async (req, res) => {
  try {
    const { notificationPrefs } = req.body;

    if (!notificationPrefs || typeof notificationPrefs !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid notification preferences' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { notificationPrefs },
      { new: true }
    ).select('-password');

    res.json({ success: true, message: 'Notification preferences updated', data: user });
  } catch (error) {
    console.error('NOTIFICATION PREFS ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error updating preferences' });
  }
});

// ============================================================
// OTP ROUTES
// ============================================================

app.post('/api/otp/send-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    await OTP.deleteMany({ email: normalizedEmail, type: 'verification' });

    const otp = generateOTP();
    const otpDoc = new OTP({
      email: normalizedEmail,
      otp,
      type: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await otpDoc.save();

    const emailResult = await sendOTPEmail(normalizedEmail, otp, 'verification');

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.json({ success: true, message: 'Verification OTP sent to your email' });
  } catch (error) {
    console.error('SEND VERIFICATION OTP ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

app.post('/api/otp/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await OTP.findOne({
      email: normalizedEmail,
      type: 'verification',
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid. Please request a new one.' });
    }

    if (otpDoc.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isVerified: true }
    );

    await OTP.deleteMany({ email: normalizedEmail, type: 'verification' });

    res.json({ success: true, message: 'Email verified successfully! You can now login.' });
  } catch (error) {
    console.error('VERIFY EMAIL ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error verifying OTP' });
  }
});

// ✅ College Verification OTP
app.post('/api/otp/send-college-verification', authMiddleware, async (req, res) => {
  try {
    const { collegeEmail, collegeName } = req.body;

    if (!collegeEmail || !collegeEmail.trim()) {
      return res.status(400).json({ success: false, message: 'College email is required' });
    }

    if (!collegeName || !collegeName.trim()) {
      return res.status(400).json({ success: false, message: 'College name is required' });
    }

    const normalizedEmail = collegeEmail.toLowerCase().trim();

    // Check if already college verified
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isCollegeVerified) {
      return res.status(400).json({ success: false, message: 'College email already verified' });
    }

    await OTP.deleteMany({ email: normalizedEmail, type: 'college-verification' });

    const otp = generateOTP();
    const otpDoc = new OTP({
      email: normalizedEmail,
      otp,
      type: 'college-verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await otpDoc.save();

    const emailResult = await sendOTPEmail(normalizedEmail, otp, 'college-verification');

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP to college email' });
    }

    // Store college name temporarily
    await User.findByIdAndUpdate(req.user.id, { collegeName: collegeName.trim() });

    res.json({ success: true, message: 'Verification OTP sent to your college email' });
  } catch (error) {
    console.error('SEND COLLEGE OTP ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error sending college verification OTP' });
  }
});

// ✅ Verify College Email
app.post('/api/otp/verify-college', authMiddleware, async (req, res) => {
  try {
    const { collegeEmail, otp } = req.body;

    if (!collegeEmail || !otp) {
      return res.status(400).json({ success: false, message: 'College email and OTP are required' });
    }

    const normalizedEmail = collegeEmail.toLowerCase().trim();

    const otpDoc = await OTP.findOne({
      email: normalizedEmail,
      type: 'college-verification',
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid. Please request a new one.' });
    }

    if (otpDoc.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // Update user as college verified
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        isCollegeVerified: true
      },
      { new: true }
    ).select('-password');

    await OTP.deleteMany({ email: normalizedEmail, type: 'college-verification' });

    console.log(`[College Verification] ✅ User ${updatedUser.email} college verified: ${updatedUser.collegeName}`);

    res.json({ 
      success: true, 
      message: 'College email verified successfully! You can now submit safety reports.',
      data: {
        isCollegeVerified: true,
        collegeName: updatedUser.collegeName
      }
    });
  } catch (error) {
    console.error('VERIFY COLLEGE ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error verifying college email' });
  }
});

app.post('/api/otp/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'No account found with this email' });
    }

    await OTP.deleteMany({ email: normalizedEmail, type: 'password-reset' });

    const otp = generateOTP();
    const otpDoc = new OTP({
      email: normalizedEmail,
      otp,
      type: 'password-reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await otpDoc.save();

    const emailResult = await sendOTPEmail(normalizedEmail, otp, 'password-reset');

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.json({ success: true, message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error('FORGOT PASSWORD OTP ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
});

app.post('/api/otp/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await OTP.findOne({
      email: normalizedEmail,
      type: 'password-reset',
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid. Please request a new one.' });
    }

    if (otpDoc.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashedPassword }
    );

    await OTP.deleteMany({ email: normalizedEmail, type: 'password-reset' });

    res.json({ success: true, message: 'Password reset successfully! You can now login with your new password.' });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
});

// Apply rate limiting to OTP routes
app.use('/api/otp/send-verification', authLimiter);
app.use('/api/otp/send-college-verification', authLimiter);
app.use('/api/otp/forgot-password', authLimiter);

// ============================================================
// ACCOMMODATION ROUTES
// ============================================================

app.get('/api/accommodations', async (req, res) => {
  try {
    const { search, city, type } = req.query;
    let query = {};

    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { address: { $regex: escapedSearch, $options: 'i' } },
        { city: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    if (city) {
      query.city = { $regex: escapeRegex(city), $options: 'i' };
    }

    if (type) {
      query.type = type;
    }

    const accommodations = await Accommodation.find(query)
      .select('_id name address city description amenities totalRooms occupiedRooms pricePerMonth contactPhone type latitude longitude trustScore trustScoreLabel trustScoreColor totalReports isVerified riskScore createdAt')
      .sort({ trustScore: 1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: accommodations });
  } catch (error) {
    console.error('GET ACCOMMODATIONS ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching accommodations' });
  }
});

app.get('/api/accommodations/dropdown', async (req, res) => {
  try {
    const accommodations = await Accommodation.find({})
      .select('_id name address city type')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, data: accommodations });
  } catch (error) {
    console.error('GET DROPDOWN ACCOMMODATIONS ERROR:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching accommodations' });
  }
});

app.get('/api/accommodations/with-location', async (req, res) => {
  try {
    const allAccommodations = await Accommodation.find({})
      .select('_id name address city latitude longitude trustScore trustScoreLabel totalReports type')
      .lean();

    if (allAccommodations.length === 0) {
      return res.json({ success: true, data: [], message: 'No accommodations registered yet' });
    }

    const withValidLocation = allAccommodations.filter(acc => {
      const lat = parseFloat(acc.latitude);
      const lng = parseFloat(acc.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    const normalizedData = withValidLocation.map(acc => ({
      ...acc,
      latitude: parseFloat(acc.latitude),
      longitude: parseFloat(acc.longitude)
    }));

    if (normalizedData.length === 0) {
      const withDefaultLocation = allAccommodations.map(acc => ({
        ...acc,
        latitude: 20.5937,
        longitude: 78.9629,
        hasDefaultLocation: true
      }));

      return res.json({ success: true, data: withDefaultLocation });
    }

    res.json({ success: true, data: normalizedData });
  } catch (error) {
    console.error('GET ACCOMMODATIONS WITH LOCATION ERROR:', error);
    res.status(500).json({ success: false, message: 'Error fetching accommodations' });
  }
});

app.get('/api/accommodations/:id', async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id).lean();
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    const reports = await Report.find({
      $or: [
        { accommodation: req.params.id },
        { accommodationName: accommodation.name }
      ],
      status: 'approved'
    })
    .populate('user', 'name isCollegeVerified collegeName')
    .sort({ createdAt: -1 })
    .lean();

    res.json({
      success: true,
      data: {
        ...accommodation,
        reports
      }
    });
  } catch (error) {
    console.error('GET ACCOMMODATION BY ID ERROR:', error);
    res.status(500).json({ success: false, message: 'Error fetching accommodation' });
  }
});

app.post('/api/accommodations/:id/recalculate-score', authMiddleware, async (req, res) => {
  try {
    await updateAccommodationScore(Accommodation, Report, req.params.id);
    const acc = await Accommodation.findById(req.params.id)
      .select('trustScore trustScoreLabel trustScoreColor totalReports').lean();
    res.json({ success: true, data: acc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recalculating score' });
  }
});

// ============================================================
// ERROR HANDLERS
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR:', err.message);
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate entry found' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      if (verifyReportImage) {
        console.log('🤖 AI Verification: Enabled');
      } else {
        console.log('⚠️  AI Verification: Disabled');
      }
      console.log('🎓 College verification required for reporting: Enabled');
      console.log('✅ Owner verification system: Active');
    });
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));```

---

## aiVerification.js (456 lines)

```javascript
// ============================================================
// server/utils/aiVerification.js
// AI-Powered Image Verification for Safety Reports
// Uses: Mistral (Vision) + Groq (Text Analysis) for reliable verification
// ============================================================

// ✅ Conditional Mistral import
let Mistral;
try {
  const mistralModule = require("@mistralai/mistralai");
  Mistral = mistralModule.Mistral;
  console.log('[AI Verification] Mistral SDK loaded');
} catch (err) {
  console.warn('[AI Verification] Mistral SDK not installed. Run: npm install @mistralai/mistralai');
}

// ✅ Initialize Mistral client if available
let mistralClient;
if (Mistral && process.env.MISTRAL_API_KEY) {
  try {
    mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    console.log('[AI Verification] Mistral client initialized');
  } catch (err) {
    console.warn('[AI Verification] Mistral client initialization failed:', err.message);
  }
}

// ============================================================
// HELPER: Parse AI response JSON safely
// ============================================================
function parseAIResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty or invalid response');
  }

  // Remove markdown code blocks
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Try to find JSON object in response
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    clean = jsonMatch[0];
  }

  return JSON.parse(clean);
}

// ============================================================
// HELPER: Create default error response
// ============================================================
function createErrorResponse(source, errorMessage) {
  return {
    source,
    error: errorMessage,
    isRelevant: null,
    issueDetected: 'Error',
    severity: 'none',
    confidence: 0,
    redFlags: [],
    description: `Verification failed: ${errorMessage}`
  };
}

// ============================================================
// VERIFIER 1 — Mistral Pixtral 12B (Primary Vision Model)
// ✅ Working perfectly - analyzes actual image content
// ============================================================
async function verifyWithMistral(imageUrl, issueType) {
  if (!mistralClient || !process.env.MISTRAL_API_KEY) {
    console.warn('[Mistral] Not configured or SDK not installed');
    return createErrorResponse('mistral', 'Mistral not configured');
  }

  try {
    console.log('[Mistral] Starting vision analysis...');

    const response = await mistralClient.chat.complete({
      model: "pixtral-12b-2409",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              imageUrl: imageUrl,
            },
            {
              type: "text",
              text: `You are a complaint verification system for a student accommodation safety platform.
A student submitted a complaint about: "${issueType}".

Analyze this image carefully and determine if it shows evidence related to the complaint type.

Return ONLY valid JSON with no extra text, markdown, or explanation:
{
  "isRelevant": true or false,
  "issueDetected": "short description of what you see in the image",
  "severity": "low" or "medium" or "high" or "none",
  "confidence": number between 0 and 1,
  "redFlags": ["list", "of", "specific", "concerns"],
  "description": "detailed explanation of your analysis"
}

Guidelines:
- isRelevant = true if the image shows evidence related to "${issueType}"
- severity = "high" for health hazards, "medium" for inconveniences, "low" for minor issues
- confidence = how certain you are about your assessment (0.0 to 1.0)
- Be strict: only mark as relevant if you clearly see evidence of the reported issue
- Be specific about what you observe in the image`
            },
          ],
        },
      ],
    });

    const text = response.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response text from Mistral');
    }

    const parsed = parseAIResponse(text);
    console.log('[Mistral] Success - isRelevant:', parsed.isRelevant, '| Confidence:', parsed.confidence);

    return { source: "mistral", ...parsed };
  } catch (err) {
    console.error("[Mistral] Error:", err.message);
    return createErrorResponse('mistral', err.message);
  }
}

// ============================================================
// VERIFIER 2 — Groq + Llama 3.3 (Context Analysis)
// ✅ Analyzes complaint context and plausibility
// ============================================================
async function verifyWithGroq(imageUrl, issueType) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('[Groq] API key not configured');
    return createErrorResponse('groq', 'API key not configured');
  }

  try {
    console.log('[Groq] Starting context analysis...');

    const prompt = `You are a complaint verification system for a student accommodation safety platform.

A student submitted a complaint about: "${issueType}" and provided an image as evidence.

Analyze the complaint type and assess its legitimacy based on common accommodation safety issues.

Consider these factors:
1. Is "${issueType}" a valid and common accommodation safety concern?
2. Would this type of issue typically have visual evidence?
3. Is this complaint category prone to abuse or fake reports?
4. What severity level is typically associated with "${issueType}" issues?

Return ONLY valid JSON with no extra text, markdown, or explanation:
{
  "isRelevant": true or false,
  "issueDetected": "Assessment of complaint type validity",
  "severity": "low" or "medium" or "high" or "none",
  "confidence": number between 0 and 1,
  "redFlags": ["list of concerns or validation points"],
  "description": "detailed reasoning for your assessment"
}

Be objective and base your analysis on:
- Common accommodation safety issues (food safety, water quality, hygiene, infrastructure, security)
- Typical severity levels for this complaint category
- Whether image evidence is appropriate for this issue type

Note: This is a context-based assessment to complement image analysis from other AI models.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error: ${res.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || 'Groq API error');
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response text from Groq');
    }

    const parsed = parseAIResponse(text);
    console.log('[Groq] Success - isRelevant:', parsed.isRelevant, '| Confidence:', parsed.confidence);

    return { source: "groq", ...parsed };
  } catch (err) {
    console.error("[Groq] Error:", err.message);
    return createErrorResponse('groq', err.message);
  }
}

// ============================================================
// SUMMARIZER — Groq + Llama 3.3 70B
// Combines vision + context analysis into final verdict
// ============================================================
async function summarizeWithGroq(results, issueType) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('[Summarizer] Groq API key not configured');
    return createFallbackVerdict(results);
  }

  try {
    console.log('[Summarizer] Creating final verdict...');

    const prompt = `You are a safety verification system for student accommodations.

Two AI systems analyzed a complaint about: "${issueType}":
1. Mistral Vision Model: Analyzed the actual image content
2. Context Analyzer: Assessed complaint validity and severity

Here are their results:
${JSON.stringify(results, null, 2)}

Based on both analyses, determine the final verdict.

Return ONLY valid JSON with no extra text or markdown:
{
  "finalVerdict": "VERIFIED" or "REJECTED" or "NEEDS_REVIEW",
  "overallSeverity": "low" or "medium" or "high" or "none",
  "confidenceScore": number between 0 and 1,
  "summary": "one clear sentence explaining the verdict",
  "recommendAdminReview": true or false
}

Decision Rules:
1. VERIFIED = Mistral vision model confirms isRelevant=true AND confidence > 0.6
2. REJECTED = Mistral vision model confirms isRelevant=false AND confidence > 0.7
3. NEEDS_REVIEW = Low confidence, models disagree, or errors occurred
4. Prioritize Mistral's vision analysis over context analysis
5. recommendAdminReview = true if:
   - Severity is "high"
   - Confidence < 0.7
   - Models strongly disagree
   - Any errors occurred
6. Use average confidence from successful models
7. Use highest severity reported`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error: ${res.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response from summarizer');
    }

    const parsed = parseAIResponse(text);
    console.log('[Summarizer] Final verdict:', parsed.finalVerdict, '| Confidence:', parsed.confidenceScore);

    return parsed;
  } catch (err) {
    console.error("[Summarizer] Error:", err.message);
    return createFallbackVerdict(results);
  }
}

// ============================================================
// HELPER: Create fallback verdict when summarizer fails
// ============================================================
function createFallbackVerdict(results) {
  // Count successful results
  const successfulResults = results.filter(r => r.isRelevant !== null && !r.error);

  if (successfulResults.length === 0) {
    return {
      finalVerdict: "NEEDS_REVIEW",
      overallSeverity: "unknown",
      confidenceScore: 0,
      summary: "All AI models failed - manual review required.",
      recommendAdminReview: true
    };
  }

  // Prioritize Mistral (vision model)
  const mistralResult = results.find(r => r.source === 'mistral' && !r.error);
  
  let finalVerdict;
  let summary;
  
  if (mistralResult && mistralResult.isRelevant !== null) {
    // Use Mistral's decision as primary
    if (mistralResult.isRelevant && mistralResult.confidence > 0.6) {
      finalVerdict = "VERIFIED";
      summary = `Vision analysis confirmed the reported issue with ${Math.round(mistralResult.confidence * 100)}% confidence.`;
    } else if (!mistralResult.isRelevant && mistralResult.confidence > 0.7) {
      finalVerdict = "REJECTED";
      summary = `Vision analysis found no evidence of the reported issue with ${Math.round(mistralResult.confidence * 100)}% confidence.`;
    } else {
      finalVerdict = "NEEDS_REVIEW";
      summary = `Vision analysis was inconclusive (${Math.round(mistralResult.confidence * 100)}% confidence) - admin review recommended.`;
    }
  } else {
    // Fallback to voting system
    const relevantVotes = successfulResults.filter(r => r.isRelevant === true).length;
    const irrelevantVotes = successfulResults.filter(r => r.isRelevant === false).length;
    
    if (relevantVotes > irrelevantVotes) {
      finalVerdict = "VERIFIED";
      summary = `${relevantVotes} of ${successfulResults.length} models found the complaint relevant.`;
    } else if (irrelevantVotes > relevantVotes) {
      finalVerdict = "REJECTED";
      summary = `${irrelevantVotes} of ${successfulResults.length} models found the complaint not relevant.`;
    } else {
      finalVerdict = "NEEDS_REVIEW";
      summary = "Models disagreed - manual review required.";
    }
  }

  // Calculate average confidence
  const avgConfidence = successfulResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / successfulResults.length;

  // Find highest severity
  const severityOrder = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
  const maxSeverity = successfulResults.reduce((max, r) => {
    const current = severityOrder[r.severity] || 0;
    const maxVal = severityOrder[max] || 0;
    return current > maxVal ? r.severity : max;
  }, 'none');

  return {
    finalVerdict,
    overallSeverity: maxSeverity,
    confidenceScore: Math.round(avgConfidence * 100) / 100,
    summary,
    recommendAdminReview: finalVerdict === "NEEDS_REVIEW" || maxSeverity === "high" || avgConfidence < 0.7
  };
}

// ============================================================
// MAIN EXPORT — Verify a report image
// ============================================================
async function verifyReportImage(imageUrl, issueType) {
  const startTime = Date.now();

  try {
    console.log('================================================');
    console.log('[AI Verification] Starting 2-model verification system');
    console.log(`[AI Verification] Issue Type: ${issueType}`);
    console.log(`[AI Verification] Image URL: ${imageUrl.substring(0, 80)}...`);
    console.log('================================================');

    // ✅ Validate inputs
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid or missing image URL');
    }

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      throw new Error('Image URL must start with http:// or https://');
    }

    if (!issueType || typeof issueType !== 'string') {
      throw new Error('Invalid or missing issue type');
    }

    // ✅ Run both models in parallel
    const [mistralResult, groqResult] = await Promise.allSettled([
      verifyWithMistral(imageUrl, issueType),
      verifyWithGroq(imageUrl, issueType),
    ]);

    // Extract results
    const results = [
      mistralResult.status === 'fulfilled' ? mistralResult.value : createErrorResponse('mistral', 'Promise rejected'),
      groqResult.status === 'fulfilled' ? groqResult.value : createErrorResponse('groq', 'Promise rejected'),
    ];

    console.log('[AI Verification] Individual results:');
    console.log('  - Mistral (Vision):', results[0].isRelevant, '| Confidence:', results[0].confidence, '| Error:', results[0].error || 'none');
    console.log('  - Groq (Context):', results[1].isRelevant, '| Confidence:', results[1].confidence, '| Error:', results[1].error || 'none');

    // ✅ Summarize into final verdict
    const verdict = await summarizeWithGroq(results, issueType);

    const duration = Date.now() - startTime;
    console.log(`[AI Verification] Completed in ${duration}ms`);
    console.log(`[AI Verification] Final Verdict: ${verdict.finalVerdict}`);
    console.log(`[AI Verification] Confidence: ${verdict.confidenceScore}`);
    console.log(`[AI Verification] Summary: ${verdict.summary}`);
    console.log('================================================');

    return {
      success: true,
      verdict: verdict.finalVerdict,
      severity: verdict.overallSeverity,
      confidence: verdict.confidenceScore,
      summary: verdict.summary,
      recommendAdminReview: verdict.recommendAdminReview,
      details: {
        mistral: results[0],
        groq: results[1],
      },
      timestamp: new Date().toISOString(),
      processingTimeMs: duration
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[AI Verification] Fatal error after ${duration}ms:`, err.message);

    return {
      success: false,
      verdict: "NEEDS_REVIEW",
      severity: "unknown",
      confidence: 0,
      summary: `Verification system error: ${err.message}`,
      recommendAdminReview: true,
      details: {
        mistral: null,
        groq: null,
        error: err.message
      },
      timestamp: new Date().toISOString(),
      processingTimeMs: duration
    };
  }
}

module.exports = { verifyReportImage };```

---

## collegeVerification.js (359 lines)

```javascript
// List of verified Indian B.Tech college domains
const verifiedCollegeDomains = {
  // IITs
  'iitd.ac.in': 'IIT Delhi',
  'iitb.ac.in': 'IIT Bombay',
  'iitm.ac.in': 'IIT Madras',
  'iitkgp.ac.in': 'IIT Kharagpur',
  'iitk.ac.in': 'IIT Kanpur',
  'iitg.ac.in': 'IIT Guwahati',
  'iith.ac.in': 'IIT Hyderabad',
  'iitr.ac.in': 'IIT Roorkee',
  'iitbbs.ac.in': 'IIT Bhubaneswar',
  'iiti.ac.in': 'IIT Indore',
  'iitp.ac.in': 'IIT Patna',
  'iitj.ac.in': 'IIT Jodhpur',
  'iitgn.ac.in': 'IIT Gandhinagar',
  'iitmandi.ac.in': 'IIT Mandi',
  'iitdh.ac.in': 'IIT Dharwad',
  'iitbhilai.ac.in': 'IIT Bhilai',
  'iitgoa.ac.in': 'IIT Goa',
  'iitjammu.ac.in': 'IIT Jammu',
  'iitpkd.ac.in': 'IIT Palakkad',
  'iittirupati.ac.in': 'IIT Tirupati',
  
  // NITs
  'nitw.ac.in': 'NIT Warangal',
  'nitt.edu': 'NIT Trichy',
  'nitk.ac.in': 'NIT Karnataka',
  'mnnit.ac.in': 'MNNIT Allahabad',
  'vnit.ac.in': 'VNIT Nagpur',
  'nitc.ac.in': 'NIT Calicut',
  'manit.ac.in': 'MANIT Bhopal',
  'svnit.ac.in': 'SVNIT Surat',
  'mnit.ac.in': 'MNIT Jaipur',
  'nits.ac.in': 'NIT Silchar',
  'nitrkl.ac.in': 'NIT Rourkela',
  'nitdgp.ac.in': 'NIT Durgapur',
  'nita.ac.in': 'NIT Agartala',
  'nitp.ac.in': 'NIT Patna',
  'nitrr.ac.in': 'NIT Raipur',
  'nitj.ac.in': 'NIT Jalandhar',
  'nitsri.ac.in': 'NIT Srinagar',
  'nituk.ac.in': 'NIT Uttarakhand',
  'nitgoa.ac.in': 'NIT Goa',
  'nitm.ac.in': 'NIT Meghalaya',
  'nitnagaland.ac.in': 'NIT Nagaland',
  'nitmizoram.ac.in': 'NIT Mizoram',
  'nitsikkim.ac.in': 'NIT Sikkim',
  'nitap.ac.in': 'NIT Arunachal Pradesh',
  'nitdelhi.ac.in': 'NIT Delhi',
  'nitpy.ac.in': 'NIT Puducherry',
  'nitandhra.ac.in': 'NIT Andhra Pradesh',
  
  // IIITs
  'iiitd.ac.in': 'IIIT Delhi',
  'iiith.ac.in': 'IIIT Hyderabad',
  'iiitb.ac.in': 'IIIT Bangalore',
  'iiita.ac.in': 'IIIT Allahabad',
  'iiitdm.ac.in': 'IIITDM Jabalpur',
  'iiitdmj.ac.in': 'IIITDM Jabalpur',
  'iiitk.ac.in': 'IIIT Kancheepuram',
  'iiitkota.ac.in': 'IIIT Kota',
  'iiitl.ac.in': 'IIIT Lucknow',
  'iiitm.ac.in': 'IIIT Gwalior',
  'iiitn.ac.in': 'IIIT Nagpur',
  'iiitp.ac.in': 'IIIT Pune',
  'iiitr.ac.in': 'IIIT Ranchi',
  'iiits.ac.in': 'IIIT Sri City',
  'iiitsonepat.ac.in': 'IIIT Sonepat',
  'iiitv.ac.in': 'IIIT Vadodara',
  'iiitbh.ac.in': 'IIIT Bhagalpur',
  'iiitdwd.ac.in': 'IIIT Dharwad',
  'iiitkottayam.ac.in': 'IIIT Kottayam',
  'iiitkalyani.ac.in': 'IIIT Kalyani',
  'iiitmk.ac.in': 'IIIT Manipur',
  'iiitnr.ac.in': 'IIIT Naya Raipur',
  'iiituna.ac.in': 'IIIT Una',
  'iiitbhopal.ac.in': 'IIIT Bhopal',
  'iiitsurat.ac.in': 'IIIT Surat',
  'iiitagartala.ac.in': 'IIIT Agartala',
  'iiitraichur.ac.in': 'IIIT Raichur',
  'iiittiruchirappalli.ac.in': 'IIIT Tiruchirappalli',
  
  // Top Private Universities
  'bits-pilani.ac.in': 'BITS Pilani',
  'pilani.bits-pilani.ac.in': 'BITS Pilani',
  'goa.bits-pilani.ac.in': 'BITS Pilani Goa',
  'hyderabad.bits-pilani.ac.in': 'BITS Pilani Hyderabad',
  'vit.ac.in': 'VIT Vellore',
  'vitstudent.ac.in': 'VIT Vellore',
  'manipal.edu': 'Manipal Institute of Technology',
  'learner.manipal.edu': 'Manipal Institute of Technology',
  'thapar.edu': 'Thapar University',
  'srmist.edu.in': 'SRM Institute of Science and Technology',
  'srmuniv.ac.in': 'SRM University',
  'amity.edu': 'Amity University',
  'lpu.in': 'Lovely Professional University',
  'chitkara.edu.in': 'Chitkara University',
  'bennett.edu.in': 'Bennett University',
  'sharda.ac.in': 'Sharda University',
  'gitam.edu': 'GITAM University',
  'kluniversity.in': 'KL University',
  'snu.edu.in': 'Shiv Nadar University',
  'ashoka.edu.in': 'Ashoka University',
  'plaksha.edu.in': 'Plaksha University',
  'krea.edu.in': 'Krea University',
  'flame.edu.in': 'FLAME University',
  'sitpune.edu.in': 'Symbiosis Institute of Technology',
  
  // Delhi NCR
  'dtu.ac.in': 'Delhi Technological University',
  'nsut.ac.in': 'NSUT Delhi',
  'nsit.ac.in': 'Netaji Subhas Institute of Technology',
  'igdtuw.ac.in': 'IGDTUW Delhi',
  'jiit.ac.in': 'JIIT Noida',
  'galgotiasuniversity.edu.in': 'Galgotias University',
  'galgotiacollege.edu': 'Galgotias College',
  'aktu.ac.in': 'AKTU',
  'gbpuat.ac.in': 'GBPUAT Pantnagar',
  
  // Hyderabad Colleges
  'vce.ac.in': 'Vasavi College of Engineering',
  'cbit.ac.in': 'CBIT Hyderabad',
  'cvr.ac.in': 'CVR College of Engineering',
  'mgit.ac.in': 'MGIT Hyderabad',
  'griet.ac.in': 'GRIET Hyderabad',
  'cmrcet.ac.in': 'CMRCET Hyderabad',
  'vardhaman.org': 'Vardhaman College of Engineering',
  'snist.ac.in': 'Sreenidhi Institute of Science and Technology',
  'mjcollege.ac.in': 'MJ College of Engineering',
  'mlrinstitutions.ac.in': 'MLR Institute of Technology',
  'bvrit.ac.in': 'BVRIT Hyderabad',
  'bvrith.ac.in': 'BVRIT Hyderabad for Women',
  'vnrvjiet.ac.in': 'VNRVJIET',
  'jntuh.ac.in': 'JNTUH Hyderabad',
  'osmania.ac.in': 'Osmania University',
  'uceou.edu': 'University College of Engineering OU',
  'cse.iiit.ac.in': 'IIIT Hyderabad CSE',
  'students.iiit.ac.in': 'IIIT Hyderabad',
  'research.iiit.ac.in': 'IIIT Hyderabad',
  'kitsw.ac.in': 'KITSW Warangal',
  'anurag.edu.in': 'Anurag University',
  'mrec.ac.in': 'Malla Reddy Engineering College',
  'mrecw.ac.in': 'Malla Reddy Engineering College for Women',
  'kmit.in': 'KMIT Hyderabad',
  'ngit.ac.in': 'Neil Gogte Institute of Technology',
  'cvsr.ac.in': 'CVSR College of Engineering',
  'vjit.ac.in': 'Vidya Jyothi Institute of Technology',
  'sphoorthy.ac.in': 'Sphoorthy Engineering College',
  'lords.ac.in': 'Lords Institute of Engineering and Technology',
  
  // Bangalore Colleges
  'rvce.edu.in': 'RV College of Engineering',
  'bmsce.ac.in': 'BMS College of Engineering',
  'bmsit.ac.in': 'BMS Institute of Technology',
  'msrit.edu': 'MS Ramaiah Institute of Technology',
  'pes.edu': 'PES University',
  'pesu.pes.edu': 'PES University',
  'nie.ac.in': 'NIE Mysore',
  'sjce.ac.in': 'SJCE Mysore',
  'dsce.edu.in': 'Dayananda Sagar College of Engineering',
  'cmrit.ac.in': 'CMR Institute of Technology',
  'nmit.ac.in': 'Nitte Meenakshi Institute of Technology',
  'rnsit.ac.in': 'RNS Institute of Technology',
  'cit.edu.in': 'Cambridge Institute of Technology',
  'jssateb.ac.in': 'JSS Academy of Technical Education',
  'sirmvit.edu': 'Sir MVIT Bangalore',
  'nhce.ac.in': 'New Horizon College of Engineering',
  'gitam.in': 'GITAM Bangalore',
  
  // Chennai/Tamil Nadu
  'annauniv.edu': 'Anna University',
  'ceg.annauniv.edu': 'College of Engineering Guindy',
  'mit.annauniv.edu': 'MIT Anna University',
  'act.annauniv.edu': 'ACT Anna University',
  'ssn.edu.in': 'SSN College of Engineering',
  'psgtech.edu': 'PSG College of Technology',
  'tce.edu': 'Thiagarajar College of Engineering',
  'nitt.edu': 'NIT Trichy',
  'srmuniv.edu.in': 'SRM University',
  'vit.ac.in': 'VIT Chennai',
  'svce.ac.in': 'Sri Venkateswara College of Engineering',
  'sairam.edu.in': 'Sri Sairam Engineering College',
  'rajalakshmi.org': 'Rajalakshmi Engineering College',
  'saveetha.ac.in': 'Saveetha Engineering College',
  'kct.ac.in': 'Kumaraguru College of Technology',
  'licet.ac.in': 'Loyola ICAM College of Engineering',
  'easwari.ac.in': 'Easwari Engineering College',
  'jeppiaarinstitute.org': 'Jeppiaar Engineering College',
  
  // Mumbai/Maharashtra
  'coep.ac.in': 'COEP Pune',
  'vjti.ac.in': 'VJTI Mumbai',
  'pict.edu': 'PICT Pune',
  'mitpune.edu.in': 'MIT Pune',
  'mitindia.edu': 'MIT Pune',
  'spit.ac.in': 'Sardar Patel Institute of Technology',
  'djsce.ac.in': 'DJ Sanghvi College of Engineering',
  'thadomal.org': 'Thadomal Shahani Engineering College',
  'somaiya.edu': 'KJ Somaiya College of Engineering',
  'vesit.edu': 'Vivekanand Education Society',
  'sakec.ac.in': 'Shah & Anchor Kutchhi Engineering College',
  'fcrit.ac.in': 'FR. Conceicao Rodrigues Institute of Technology',
  'xaviers.edu.in': "St. Xavier's College",
  'rait.ac.in': 'Ramrao Adik Institute of Technology',
  'pccoer.com': 'PCCOE Ravet',
  'sinhgad.edu': 'Sinhgad Institutes',
  'cummins.edu.in': 'Cummins College of Engineering for Women',
  'pvgcoet.ac.in': 'PVG College of Engineering',
  
  // West Bengal
  'jaduniv.edu.in': 'Jadavpur University',
  'iiests.ac.in': 'IIEST Shibpur',
  'iem.edu.in': 'Institute of Engineering and Management',
  'uem.edu.in': 'University of Engineering and Management',
  'bcrec.ac.in': 'BC Roy Engineering College',
  'hfrp.ac.in': 'Hooghly Engineering & Technology College',
  'klyuniv.ac.in': 'University of Kalyani',
  'makautexam.net': 'MAKAUT West Bengal',
  'rcciit.org': 'RCC Institute of Information Technology',
  'msit.edu.in': 'Meghnad Saha Institute of Technology',
  'jiscollege.ac.in': 'JIS College of Engineering',
  'gnit.ac.in': 'Guru Nanak Institute of Technology',
  'heritage.ac.in': 'Heritage Institute of Technology',
  'techno.ac.in': 'Techno Main Salt Lake',
  'aot.edu.in': 'Academy of Technology',
  
  // Other States
  'iisc.ac.in': 'IISc Bangalore',
  'iiserkol.ac.in': 'IISER Kolkata',
  'iiserpune.ac.in': 'IISER Pune',
  'iiserbpr.ac.in': 'IISER Bhopal',
  'iisermohali.ac.in': 'IISER Mohali',
  'iisertvm.ac.in': 'IISER Thiruvananthapuram',
  'iisertirupati.ac.in': 'IISER Tirupati',
  'iiserbr.ac.in': 'IISER Berhampur',
  'cusat.ac.in': 'CUSAT Kerala',
  'nitpy.ac.in': 'NIT Puducherry',
  'pondiuni.edu.in': 'Pondicherry University',
  'bhu.ac.in': 'Banaras Hindu University',
  'itbhu.ac.in': 'IIT BHU',
  'iitbhu.ac.in': 'IIT BHU',
  'du.ac.in': 'Delhi University',
  'ipu.ac.in': 'IP University Delhi',
  'uohyd.ac.in': 'University of Hyderabad',
  'hcu.ac.in': 'University of Hyderabad',
  'bitmesra.ac.in': 'BIT Mesra',
  'birlainstituteoftech.ac.in': 'BIT Mesra',
  'rgipt.ac.in': 'RGIPT Amethi',
  'iiitranchi.ac.in': 'IIIT Ranchi',
  'iiitdmk.ac.in': 'IIITDM Kancheepuram',
  
  // Generic patterns for state universities
  'gcet.ac.in': 'Government College of Engineering and Technology',
  'geu.ac.in': 'Graphic Era University',
  'gbu.ac.in': 'Gautam Buddha University',
  'mdu.ac.in': 'Maharshi Dayanand University',
  'ptu.ac.in': 'Punjab Technical University',
  'gtu.ac.in': 'Gujarat Technological University',
  'rgpv.ac.in': 'RGPV Bhopal',
  'uptu.ac.in': 'UPTU/AKTU',
  'sppu.ac.in': 'Savitribai Phule Pune University',
  'unipune.ac.in': 'Pune University',
  'mu.ac.in': 'Mumbai University',
  'vtu.ac.in': 'VTU Karnataka',
  'ktu.edu.in': 'KTU Kerala',
  'caluniv.ac.in': 'University of Calcutta',
};

// Common education domain patterns (fallback)
const educationPatterns = [
  '.ac.in',      // Most Indian colleges
  '.edu.in',     // Educational institutions
  '.edu',        // International universities
  '.ernet.in',   // Education network
  '.res.in',     // Research institutions
];

/**
 * Check if email is from a verified college
 * @param {string} email - User's email address
 * @returns {object} - { isVerified: boolean, collegeName: string|null }
 */
function checkCollegeEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isVerified: false, collegeName: null };
  }

  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split('@')[1];

  if (!domain) {
    return { isVerified: false, collegeName: null };
  }

  // 1. Check exact domain match (specific colleges)
  if (verifiedCollegeDomains[domain]) {
    return {
      isVerified: true,
      collegeName: verifiedCollegeDomains[domain]
    };
  }

  // 2. Check subdomain (e.g., student.vce.ac.in)
  const domainParts = domain.split('.');
  for (let i = 1; i < domainParts.length; i++) {
    const parentDomain = domainParts.slice(i).join('.');
    if (verifiedCollegeDomains[parentDomain]) {
      return {
        isVerified: true,
        collegeName: verifiedCollegeDomains[parentDomain]
      };
    }
  }

  // 3. Check for common education patterns
  for (const pattern of educationPatterns) {
    if (domain.endsWith(pattern)) {
      // Extract college name from domain (best effort)
      const collegeName = domain
        .replace(pattern, '')
        .split('.')
        .filter(part => part.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        isVerified: true,
        collegeName: collegeName || 'Educational Institution'
      };
    }
  }

  // 4. Not a college email
  return { isVerified: false, collegeName: null };
}

/**
 * Get all verified college domains
 * @returns {object} - Object with domain as key and college name as value
 */
function getVerifiedDomains() {
  return verifiedCollegeDomains;
}

/**
 * Add a new college domain
 * @param {string} domain - Domain to add
 * @param {string} collegeName - Name of the college
 */
function addCollegeDomain(domain, collegeName) {
  verifiedCollegeDomains[domain.toLowerCase()] = collegeName;
}

module.exports = {
  checkCollegeEmail,
  getVerifiedDomains,
  addCollegeDomain,
  verifiedCollegeDomains
};```

---

## emailService.js (154 lines)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const emailTemplates = require('./emailTemplates');

transporter.verify()
  .then(() => console.log('Email service ready'))
  .catch(err => console.error('Email service error:', err.message));

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generic email sender
async function sendEmail(to, subject, htmlContent) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured');
      return { success: false, message: 'Email not configured' };
    }

    const mailOptions = {
      from: `"Student Safety Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// Specific email senders
async function sendWelcomeEmail(userEmail, userName, verificationLink) {
  const html = emailTemplates.welcomeEmail(userName, verificationLink);
  return sendEmail(userEmail, 'Welcome to Student Accommodation Safety Platform! 🎓', html);
}

async function sendReportApprovedEmail(userEmail, userName, accommodationName, reportId, viewLink) {
  const html = emailTemplates.reportApprovedEmail(userName, accommodationName, reportId, viewLink);
  return sendEmail(userEmail, '✅ Your safety report has been approved', html);
}

async function sendReportRejectedEmail(userEmail, userName, accommodationName, reason) {
  const html = emailTemplates.reportRejectedEmail(userName, accommodationName, reason);
  return sendEmail(userEmail, '❌ Your safety report was not approved', html);
}

async function sendOwnerNewReportEmail(ownerEmail, ownerName, accommodationName, issueType, reportLink) {
  const html = emailTemplates.ownerNewReportEmail(ownerName, accommodationName, issueType, reportLink);
  return sendEmail(ownerEmail, '🚨 New safety report on your property', html);
}

async function sendStudentResolvedEmail(studentEmail, studentName, accommodationName, resolutionDetails, verifyLink) {
  const html = emailTemplates.studentResolvedEmail(studentName, accommodationName, resolutionDetails, verifyLink);
  return sendEmail(studentEmail, '🔧 Owner has resolved your report', html);
}

async function sendOwnerVerifiedEmail(ownerEmail, ownerName, accommodationName, feedback, trustScoreChange) {
  const html = emailTemplates.ownerVerifiedEmail(ownerName, accommodationName, feedback, trustScoreChange);
  return sendEmail(ownerEmail, '✅ Student verified your resolution - Trust score improved!', html);
}

async function sendOwnerDisputedEmail(ownerEmail, ownerName, accommodationName, disputeReason, resolveAgainLink) {
  const html = emailTemplates.ownerDisputedEmail(ownerName, accommodationName, disputeReason, resolveAgainLink);
  return sendEmail(ownerEmail, '⚠️ Student disputed your resolution', html);
}

async function sendPasswordResetSuccessEmail(userEmail, userName) {
  const html = emailTemplates.passwordResetSuccessEmail(userName);
  return sendEmail(userEmail, '🔒 Your password has been reset', html);
}

async function sendOTPEmail(to, otp, type) {
  const isVerification = type === 'verification';

  const subject = isVerification
    ? 'Verify Your Email - SafeStay'
    : 'Reset Your Password - SafeStay';

  const heading = isVerification
    ? 'Email Verification'
    : 'Password Reset';

  const message = isVerification
    ? 'Thank you for registering on SafeStay. Use the code below to verify your email address.'
    : 'We received a request to reset your password. Use the code below to proceed.';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🏠 SafeStay</h1>
        <p style="color: #dbeafe; margin-top: 8px;">Student Accommodation Safety Platform</p>
      </div>
      <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1e293b; margin-top: 0;">${heading}</h2>
        <p style="color: #475569; line-height: 1.6;">${message}</p>
        <div style="background: white; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
          <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">Your verification code:</p>
          <h1 style="color: #1d4ed8; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #ef4444; font-size: 14px; font-weight: bold;">⏰ This code expires in 10 minutes.</p>
        <p style="color: #475569; font-size: 14px;">If you did not request this, please ignore this email.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          This email was sent by SafeStay Platform. Do not reply to this email.
        </p>
      </div>
    </div>
  `;

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not configured');
      return { success: false, message: 'Email not configured' };
    }

    await transporter.sendMail({
      from: `"SafeStay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, message: error.message };
  }
}

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendReportApprovedEmail,
  sendReportRejectedEmail,
  sendOwnerNewReportEmail,
  sendStudentResolvedEmail,
  sendOwnerVerifiedEmail,
  sendOwnerDisputedEmail,
  sendPasswordResetSuccessEmail
};
```

---

## emailTemplates.js (196 lines)

```javascript
const getBaseTemplate = (title, content, buttonText, buttonLink, color = '#3b82f6') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center;">
            <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${color} 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏠 Student Safety Platform</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                  
                  <!-- CTA Button -->
                  ${buttonText && buttonLink ? `
                  <table role="presentation" style="margin: 30px 0; width: 100%;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${buttonLink}" style="background-color: ${color}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                          ${buttonText}
                        </a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    Made with ❤️ for student safety and welfare
                  </p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                    If you didn't request this email, please ignore it.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const welcomeEmail = (userName, verificationLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${userName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Welcome to the Student Accommodation Safety Platform! We're excited to have you join our community dedicated to improving student living conditions.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Please verify your email address to get started and access all platform features.
    </p>
  `;
  return getBaseTemplate('Welcome to Student Accommodation Safety Platform! 🎓', content, 'Verify Email Now', verificationLink, '#3b82f6');
};

const reportApprovedEmail = (userName, accommodationName, reportId, viewLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${userName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Great news! Your safety report for <strong>${accommodationName}</strong> has been approved by our administrators.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      The property owner has been notified and requested to address the issues raised. You can track the progress of your report on your dashboard.
    </p>
  `;
  return getBaseTemplate('✅ Your safety report has been approved', content, 'View Report', viewLink, '#22c55e');
};

const reportRejectedEmail = (userName, accommodationName, reason) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${userName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Your safety report for <strong>${accommodationName}</strong> was not approved for publication.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      <strong>Reason:</strong> ${reason}
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      If you believe this was a mistake, please contact our support team.
    </p>
  `;
  return getBaseTemplate('❌ Your safety report was not approved', content, 'Contact Admin', 'mailto:admin@studentsafety.com', '#ef4444');
};

const ownerNewReportEmail = (ownerName, accommodationName, issueType, reportLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${ownerName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      A new safety report has been filed for your property <strong>${accommodationName}</strong>.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      <strong>Issue Type:</strong> ${issueType}
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Please review the details and resolve the issue as soon as possible to maintain your property's safety rating.
    </p>
  `;
  return getBaseTemplate('🚨 New safety report on your property', content, 'Resolve Now', reportLink, '#f59e0b');
};

const studentResolvedEmail = (studentName, accommodationName, resolutionDetails, verifyLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${studentName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      The owner of <strong>${accommodationName}</strong> has marked your report as resolved.
    </p>
    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
      <p style="color: #1f2937; font-weight: bold; margin: 0 0 10px 0;">Resolution Details:</p>
      <p style="color: #4b5563; margin: 0;">${resolutionDetails.description || resolutionDetails.actionTaken}</p>
    </div>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Please verify if the issue has been fixed to your satisfaction.
    </p>
  `;
  return getBaseTemplate('🔧 Owner has resolved your report', content, 'Verify Resolution', verifyLink, '#3b82f6');
};

const ownerVerifiedEmail = (ownerName, accommodationName, feedback, trustScoreChange) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${ownerName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Great job! A student has verified your resolution for <strong>${accommodationName}</strong>.
    </p>
    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #10b981;">
      <p style="color: #065f46; font-weight: bold; margin: 0 0 5px 0;">Student Feedback:</p>
      <p style="color: #065f46; font-style: italic; margin: 0;">"${feedback}"</p>
      <p style="color: #065f46; font-weight: bold; margin: 10px 0 0 0;">Trust Score Impact: <span style="font-size: 18px;">${trustScoreChange}</span></p>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">
      Keeping your property safe and students happy improves your standing on the platform.
    </p>
  `;
  return getBaseTemplate('✅ Student verified your resolution - Trust score improved!', content, 'View Dashboard', '#', '#22c55e');
};

const ownerDisputedEmail = (ownerName, accommodationName, disputeReason, resolveAgainLink) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${ownerName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      A student has disputed your resolution for <strong>${accommodationName}</strong>.
    </p>
    <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
      <p style="color: #92400e; font-weight: bold; margin: 0 0 5px 0;">Dispute Reason:</p>
      <p style="color: #92400e; margin: 0;">${disputeReason}</p>
    </div>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      Please address the remaining issues and update the resolution status.
    </p>
  `;
  return getBaseTemplate('⚠️ Student disputed your resolution', content, 'Resolve Again', resolveAgainLink, '#eab308');
};

const passwordResetSuccessEmail = (userName) => {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Hi ${userName},</h2>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      This is a confirmation that your password for your Student Safety Platform account has been successfully reset.
    </p>
    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
      If you did not perform this action, please contact our security team immediately.
    </p>
  `;
  return getBaseTemplate('🔒 Your password has been reset', content, 'Login Now', '#', '#3b82f6');
};

module.exports = {
  welcomeEmail,
  reportApprovedEmail,
  reportRejectedEmail,
  ownerNewReportEmail,
  studentResolvedEmail,
  ownerVerifiedEmail,
  ownerDisputedEmail,
  passwordResetSuccessEmail
};
```

---

## trustScore.js (70 lines)

```javascript
function calculateTrustScore(reports) {
  if (!reports || reports.length === 0) return { score: 100, label: 'Safe', color: 'green' };

  const now = new Date();
  let totalPenalty = 0;

  const severityWeights = { 'low': 5, 'medium': 15, 'high': 30 };
  const categoryWeights = {
    'Security': 1.5, 'Food Safety': 1.3, 'Water Quality': 1.3,
    'Hygiene': 1.0, 'Infrastructure': 0.8
  };

  reports.forEach(report => {
    if (report.status === 'rejected' || report.status === 'pending') return;

    const daysSince = Math.floor((now - new Date(report.createdAt)) / (1000 * 60 * 60 * 24));
    const decayFactor = Math.max(0.1, 1 - (daysSince / 365));
    const severityPenalty = severityWeights[report.severity] || 10;
    const categoryMultiplier = categoryWeights[report.issueType] || 1.0;
    const upvoteMultiplier = 1 + (Math.min((report.upvotes || 0), 20) * 0.1);
    
    let statusMultiplier = 1.0; // Default for 'approved'
    if (report.status === 'verified') {
      statusMultiplier = 0.2; // 80% reduction
    } else if (report.status === 'disputed') {
      statusMultiplier = 1.2; // 20% increase
    } else if (report.status === 'resolved') {
      statusMultiplier = 0.5; // Bonus for resolution attempt
    }

    totalPenalty += severityPenalty * categoryMultiplier * decayFactor * upvoteMultiplier * statusMultiplier;
  });

  let score = Math.round(100 - totalPenalty);
  
  if (isNaN(score)) score = 100;
  score = Math.max(0, Math.min(100, score));

  let label, color;

  if (score >= 80) { label = 'Safe'; color = 'green'; }
  else if (score >= 50) { label = 'Caution'; color = 'yellow'; }
  else { label = 'Unsafe'; color = 'red'; }

  return { score, label, color };
}

async function updateAccommodationScore(Accommodation, Report, accommodationId) {
  if (!accommodationId) return;

  const reports = await Report.find({
    accommodation: accommodationId,
    status: { $ne: 'rejected' }
  }).lean();

  const { score, label, color } = calculateTrustScore(reports);

  const accommodation = await Accommodation.findById(accommodationId);
  if (!accommodation) return;

  await Accommodation.findByIdAndUpdate(accommodationId, {
    trustScore: score,
    trustScoreLabel: label,
    trustScoreColor: color,
    totalReports: reports.length,
    lastScoreUpdate: new Date()
  });
}

module.exports = { calculateTrustScore, updateAccommodationScore };
```

---

## package.json (32 lines)

```json
{
  "name": "server",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@mistralai/mistralai": "^2.1.2",
    "bcryptjs": "^3.0.3",
    "cloudinary": "^1.41.3",
    "cors": "^2.8.6",
    "dotenv": "^17.2.4",
    "express": "^5.2.1",
    "express-rate-limit": "^8.2.1",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.1.6",
    "multer": "^2.0.2",
    "multer-storage-cloudinary": "^4.0.0",
    "nodemailer": "^8.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.14"
  }
}
```

---

## .env.example (8 lines)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
PORT=5000
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=https://your-app.vercel.app
```

---

## .gitignore (2 lines)

```gitignore
node_modules/
.env
```

---

