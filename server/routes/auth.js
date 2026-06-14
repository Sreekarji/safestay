const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { cloudinary } = require("../config/cloudinary");
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

    // Send OTP email (await result so we can inform user on failure)
    let emailSent = false;
    let emailError = null;
    try {
      const emailResult = await sendOTPEmail(normalizedEmail, otp, 'verification');
      emailSent = emailResult.success;
      if (!emailResult.success) {
        emailError = emailResult.message || 'Failed to send email';
        console.error('[SIGNUP] OTP email failed:', emailError);
      }
    } catch (err) {
      emailError = err.message;
      console.error('[SIGNUP] OTP email exception:', err);
    }

    // ✅ Build response message
    let message = "Registration successful! Please check your email for the verification code.";
    if (collegeCheck.isVerified) {
      message = `Registration successful! College verified: ${collegeCheck.collegeName}. Check your email for OTP.`;
    }
    if (!emailSent) {
      message += " (Email could not be sent — use Resend Code on the next page)";
    }

    res.status(201).json({
      success: true,
      message,
      requiresVerification: true,
      email: newUser.email,
      isCollegeVerified: collegeCheck.isVerified,
      collegeName: collegeCheck.collegeName,
      emailSent
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

module.exports = router;