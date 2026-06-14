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

module.exports = router;