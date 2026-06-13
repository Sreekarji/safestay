import { Router, Response } from 'express';
import { User } from '../models/User.js';
import { Report } from '../models/Report.js';
import { Accommodation } from '../models/Accommodation.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { calculateSSI } from '../utils/trustScore.js';

const router = Router();

// All routes require admin
router.use(authMiddleware);
router.use(adminMiddleware);

// ========================
// GET /api/admin/stats
// ========================
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [users, accommodations, reports, verifications] = await Promise.all([
      User.countDocuments(),
      Accommodation.countDocuments({ isActive: true }),
      Report.countDocuments(),
      VerificationResult.countDocuments(),
    ]);

    const reportStats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryStats = await Report.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgSeverity: { $avg: '$severity' },
        },
      },
    ]);

    const aiStats = await VerificationResult.aggregate([
      {
        $group: {
          _id: { model: '$modelName', verdict: '$verdict' },
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers: users,
          totalAccommodations: accommodations,
          totalReports: reports,
          totalVerifications: verifications,
        },
        reportStats,
        categoryStats,
        aiStats,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/admin/reports
// ========================
router.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    const { status, category, aiVerdict, limit = 50, page = 1 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (aiVerdict) query['aiVerification.consensus'] = aiVerdict;

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('accommodationId', 'name area ssi')
        .populate('userId', 'name email college')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Report.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/admin/reports/:id/status
// ========================
router.put('/reports/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Status must be approved or rejected',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    report.status = status;
    await report.save();

    // Recalculate SSI
    const accommodation = await Accommodation.findById(report.accommodationId);
    if (accommodation) {
      const reports = await Report.find({ accommodationId: accommodation._id });
      const { ssi, categoryScores } = calculateSSI(reports, accommodation.ssi);
      accommodation.ssi = ssi;
      accommodation.categoryScores = categoryScores as any;
      accommodation.verifiedReportCount = reports.filter((r: any) =>
        ['ai_verified', 'approved', 'resolved', 'verified'].includes(r.status)
      ).length;
      await accommodation.save();
    }

    res.json({
      success: true,
      data: report,
      message: `Report ${status}`,
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/admin/reports/:id/reopen
// ========================
router.put('/reports/:id/reopen', async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    if (report.status !== 'disputed') {
      res.status(400).json({
        success: false,
        error: 'Only disputed reports can be reopened',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    report.status = 'approved';
    report.studentVerification = undefined;
    await report.save();

    res.json({
      success: true,
      data: report,
      message: 'Report reopened',
    });
  } catch (error) {
    console.error('Reopen report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// DELETE /api/admin/reports/:id
// ========================
router.delete('/reports/:id', async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Recalculate SSI
    const accommodation = await Accommodation.findById(report.accommodationId);
    if (accommodation) {
      const reports = await Report.find({ accommodationId: accommodation._id });
      const { ssi } = calculateSSI(reports, accommodation.ssi);
      accommodation.ssi = ssi;
      accommodation.reportCount = reports.length;
      await accommodation.save();
    }

    res.json({
      success: true,
      message: 'Report deleted',
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/admin/users
// ========================
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { role, isBanned, limit = 50, page = 1 } = req.query;

    const query: any = {};
    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-__v -password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/admin/users/:id/ban
// ========================
router.put('/users/:id/ban', async (req: AuthRequest, res: Response) => {
  try {
    const { isBanned } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
      message: isBanned ? 'User banned' : 'User unbanned',
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/admin/counter-reports
// ========================
router.get('/counter-reports', async (req: AuthRequest, res: Response) => {
  try {
    const reports = await Report.find({
      'counterReport.status': { $exists: true },
    })
      .populate('accommodationId', 'name area')
      .populate('userId', 'name')
      .sort({ 'counterReport.submittedAt': -1 });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Get counter-reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/admin/counter-reports/:id
// ========================
router.put('/counter-reports/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Status must be accepted or rejected',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const report = await Report.findById(req.params.id);
    if (!report || !report.counterReport) {
      res.status(404).json({
        success: false,
        error: 'Counter-report not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    report.counterReport.status = status;
    await report.save();

    res.json({
      success: true,
      data: report,
      message: `Counter-report ${status}`,
    });
  } catch (error) {
    console.error('Review counter-report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/admin/ai-performance
// ========================
router.get('/ai-performance', async (req: AuthRequest, res: Response) => {
  try {
    const performance = await VerificationResult.aggregate([
      {
        $group: {
          _id: '$modelName',
          totalVerifications: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgProcessingTime: { $avg: '$processingTime' },
          acceptCount: {
            $sum: { $cond: [{ $eq: ['$verdict', 'accept'] }, 1, 0] },
          },
          rejectCount: {
            $sum: { $cond: [{ $eq: ['$verdict', 'reject'] }, 1, 0] },
          },
          uncertainCount: {
            $sum: { $cond: [{ $eq: ['$verdict', 'uncertain'] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Get AI performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/admin/pending-owners
// ========================
router.get('/pending-owners', async (req: AuthRequest, res: Response) => {
  try {
    const owners = await User.find({
      role: 'owner',
      'ownerVerification.status': { $in: ['pending', 'under_review'] },
    }).select('-__v -password');

    res.json({
      success: true,
      data: owners,
    });
  } catch (error) {
    console.error('Get pending owners error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/admin/verify-owner/:id
// ========================
router.put('/verify-owner/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'owner') {
      res.status(404).json({
        success: false,
        error: 'Owner not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    user.ownerVerification.status = 'verified';
    user.ownerVerification.verifiedAt = new Date();
    await user.save();

    res.json({
      success: true,
      data: user,
      message: 'Owner verified successfully',
    });
  } catch (error) {
    console.error('Verify owner error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/admin/reject-owner/:id
// ========================
router.put('/reject-owner/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'owner') {
      res.status(404).json({
        success: false,
        error: 'Owner not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    user.ownerVerification.status = 'rejected';
    user.ownerVerification.rejectionReason = reason;
    await user.save();

    res.json({
      success: true,
      data: user,
      message: 'Owner rejected',
    });
  } catch (error) {
    console.error('Reject owner error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
