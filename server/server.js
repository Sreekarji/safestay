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
const { cloudinary, upload, uploadsDir } = require('./config/cloudinary');
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

// ✅ ElevenLabs Voice Service Import
let generateSSIVoiceReadout;
try {
  const voiceModule = require('./utils/elevenLabsService');
  generateSSIVoiceReadout = voiceModule.generateSSIVoiceReadout;
  console.log('[Voice Service] Module loaded successfully');
} catch (err) {
  console.warn('[Voice Service] Module not loaded:', err.message);
  generateSSIVoiceReadout = null;
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
      'http://localhost:5174',
      'http://localhost:5175',
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

const fs = require('fs');

app.post('/api/upload', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      let url, publicId;

      // Try Cloudinary first
      try {
        const b64 = file.buffer.toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'safestay/reports',
          resource_type: 'auto',
        });
        url = result.secure_url;
        publicId = result.public_id;
        console.log('[Upload] Cloudinary OK:', publicId);
      } catch (cloudErr) {
        // Fall back to local disk storage
        console.warn('[Upload] Cloudinary failed, saving locally:', cloudErr.message);
        const ext = file.originalname.split('.').pop() || 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, file.buffer);
        url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
        publicId = `local-${filename}`;
        console.log('[Upload] Saved locally:', filename);
      }

      uploadedImages.push({ url, publicId });
    }

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

    if (publicId.startsWith('local-')) {
      // Delete local file
      const filename = publicId.replace('local-', '');
      const filepath = path.join(uploadsDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } else {
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok') {
        return res.status(400).json({ success: false, message: 'Error deleting image from cloud' });
      }
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
    // Accept both old field names (accommodation, accommodationName, issueType)
    // and new client field names (accommodationId, category)
    const { accommodation: accOld, accommodationName, accommodationId: accIdFromClient, category, issueType: issueTypeOld, description, images, severity } = req.body;
    const accommodation = accOld || accIdFromClient;
    const issueType = issueTypeOld || category;

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

// Rate limiting for OTP routes (must be BEFORE route handlers)
app.use('/api/otp/send-verification', authLimiter);
app.use('/api/otp/send-college-verification', authLimiter);
app.use('/api/otp/forgot-password', authLimiter);

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

// ============================================================
// VOICE ROUTES
// ============================================================

app.post('/api/voice/ssi', authMiddleware, async (req, res) => {
  try {
    if (!generateSSIVoiceReadout) {
      return res.json({ success: true, audio: null });
    }

    const { accommodationName, ssi, topIssues } = req.body;

    if (!accommodationName || ssi === undefined) {
      return res.status(400).json({ success: false, message: 'accommodationName and ssi are required' });
    }

    const audio = await generateSSIVoiceReadout(accommodationName, ssi, topIssues || []);

    res.json({ success: true, audio });
  } catch (err) {
    console.error('[Voice] SSI readout error:', err.message);
    res.json({ success: true, audio: null });
  }
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
  .catch(err => console.error("❌ MongoDB connection error:", err));