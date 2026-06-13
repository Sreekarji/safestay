import { Router, Response } from 'express';
import { Report } from '../models/Report.js';
import { Accommodation } from '../models/Accommodation.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { reportLimiter } from '../middleware/rateLimiter.js';
import { verifyReport } from '../utils/aiVerification.js';
import { calculateSSI } from '../utils/trustScore.js';

const router = Router();

// ========================
// POST /api/reports
// ========================
router.post('/', authMiddleware, reportLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    // Check if user is a verified student
    if (!user || user.role !== 'student') {
      res.status(403).json({
        success: false,
        error: 'Only verified students can submit reports',
        code: 'FORBIDDEN',
      });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        error: 'Please verify your email before submitting reports',
        code: 'FORBIDDEN',
      });
      return;
    }

    const {
      accommodationId, category, severity, title, description,
      images = [], isAnonymous = false,
    } = req.body;

    // Validation
    if (!accommodationId || !category || !severity || !title || !description) {
      res.status(400).json({
        success: false,
        error: 'Please provide all required fields',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (severity < 1 || severity > 10) {
      res.status(400).json({
        success: false,
        error: 'Severity must be between 1 and 10',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Check accommodation exists
    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) {
      res.status(404).json({
        success: false,
        error: 'Accommodation not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Create report
    const report = new Report({
      accommodationId,
      userId: user._id,
      category,
      severity,
      title,
      description,
      images,
      isAnonymous,
      status: 'pending',
    });

    await report.save();

    // Run AI verification in background (don't await)
    verifyReport(
      report._id.toString(),
      images,
      category,
      title,
      description,
      severity
    ).then(async (aiResult) => {
      // Update report with AI results
      report.aiVerification = {
        mistral: aiResult.mistral || undefined,
        groq: aiResult.groq || undefined,
        gemini: aiResult.gemini || undefined,
        consensus: aiResult.consensus,
        overallConfidence: aiResult.overallConfidence,
        verifiedAt: new Date(),
      };

      // Set status based on consensus
      if (aiResult.consensus === 'accept' && aiResult.overallConfidence >= 0.85) {
        report.status = 'ai_verified';
      } else if (aiResult.consensus === 'reject') {
        report.status = 'rejected';
      }
      // Otherwise remains 'pending' for admin review

      await report.save();

      // Save individual verification results
      if (aiResult.mistral) {
        await VerificationResult.create({
          reportId: report._id,
          model: 'mistral',
          verdict: aiResult.mistral.verdict,
          confidence: aiResult.mistral.confidence,
          reasoning: aiResult.mistral.reasoning,
          processingTime: 0,
        });
      }

      // Recalculate SSI for the accommodation
      const reports = await Report.find({ accommodationId });
      const { ssi, categoryScores } = calculateSSI(reports, accommodation.ssi);
      accommodation.ssi = ssi;
      accommodation.categoryScores = categoryScores as any;
      accommodation.reportCount = reports.length;
      accommodation.verifiedReportCount = reports.filter((r: any) =>
        ['ai_verified', 'approved', 'resolved', 'verified'].includes(r.status)
      ).length;
      await accommodation.save();

      console.log(`✅ Report ${report._id} AI verification complete: ${aiResult.consensus}`);
    }).catch(err => {
      console.error('AI verification failed:', err);
    });

    res.status(201).json({
      success: true,
      data: {
        _id: report._id,
        accommodationId: report.accommodationId,
        category: report.category,
        severity: report.severity,
        title: report.title,
        status: report.status,
        isAnonymous: report.isAnonymous,
      },
      message: 'Report submitted. AI verification in progress.',
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/reports
// ========================
router.get('/', async (req, res: Response) => {
  try {
    const { accommodationId, status, category, limit = 20, page = 1 } = req.query;

    const query: any = {};
    if (accommodationId) query.accommodationId = accommodationId;
    if (status) query.status = status;
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('accommodationId', 'name area ssi')
        .populate('userId', 'name college isVerified')
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
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/reports/my-reports
// ========================
router.get('/my-reports', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, page = 1, status } = req.query;

    const query: any = { userId: req.user?._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('accommodationId', 'name area ssi')
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
    console.error('Get my reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/reports/:id
// ========================
router.get('/:id', async (req, res: Response) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('accommodationId', 'name area ssi location')
      .populate('userId', 'name college isVerified');

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/reports/:id
// ========================
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Check ownership
    if (report.userId.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this report',
        code: 'FORBIDDEN',
      });
      return;
    }

    const { title, description, severity, category, images } = req.body;

    // Update fields
    if (title) report.title = title;
    if (description) report.description = description;
    if (severity) report.severity = severity;
    if (category) report.category = category;

    // If images changed, re-run AI verification
    if (images && JSON.stringify(images) !== JSON.stringify(report.images)) {
      report.images = images;
      report.status = 'pending';

      // Re-run AI verification
      verifyReport(
        report._id.toString(),
        images,
        report.category,
        report.title,
        report.description,
        report.severity
      ).then(async (aiResult) => {
        report.aiVerification = {
          mistral: aiResult.mistral || undefined,
          groq: aiResult.groq || undefined,
          gemini: aiResult.gemini || undefined,
          consensus: aiResult.consensus,
          overallConfidence: aiResult.overallConfidence,
          verifiedAt: new Date(),
        };

        if (aiResult.consensus === 'accept' && aiResult.overallConfidence >= 0.85) {
          report.status = 'ai_verified';
        } else if (aiResult.consensus === 'reject') {
          report.status = 'rejected';
        }

        await report.save();
      }).catch(err => {
        console.error('AI re-verification failed:', err);
      });
    }

    await report.save();

    res.json({
      success: true,
      data: report,
      message: 'Report updated successfully',
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// DELETE /api/reports/:id
// ========================
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Check ownership or admin
    if (report.userId.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this report',
        code: 'FORBIDDEN',
      });
      return;
    }

    await Report.findByIdAndDelete(req.params.id);

    // Recalculate SSI
    const accommodation = await Accommodation.findById(report.accommodationId);
    if (accommodation) {
      const reports = await Report.find({ accommodationId: accommodation._id });
      const { ssi, categoryScores } = calculateSSI(reports, accommodation.ssi);
      accommodation.ssi = ssi;
      accommodation.categoryScores = categoryScores as any;
      accommodation.reportCount = reports.length;
      await accommodation.save();
    }

    res.json({
      success: true,
      message: 'Report deleted successfully',
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
// POST /api/reports/:id/upvote
// ========================
router.post('/:id/upvote', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Can't upvote own report
    if (report.userId.toString() === req.user?._id.toString()) {
      res.status(400).json({
        success: false,
        error: 'Cannot upvote your own report',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Toggle upvote
    const userId = req.user?._id;
    const upvoteIndex = report.upvotedBy.indexOf(userId);

    if (upvoteIndex > -1) {
      // Remove upvote
      report.upvotedBy.splice(upvoteIndex, 1);
      report.upvotes = Math.max(0, report.upvotes - 1);
    } else {
      // Add upvote
      report.upvotedBy.push(userId);
      report.upvotes += 1;
    }

    await report.save();

    // Recalculate SSI (upvotes affect penalty)
    const accommodation = await Accommodation.findById(report.accommodationId);
    if (accommodation) {
      const reports = await Report.find({ accommodationId: accommodation._id });
      const { ssi } = calculateSSI(reports, accommodation.ssi);
      accommodation.ssi = ssi;
      await accommodation.save();
    }

    res.json({
      success: true,
      data: {
        upvotes: report.upvotes,
        upvoted: upvoteIndex === -1,
      },
    });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/reports/:id/verify
// ========================
router.put('/:id/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { isResolved, feedback } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Check ownership
    if (report.userId.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to verify this resolution',
        code: 'FORBIDDEN',
      });
      return;
    }

    // Check if report is resolved
    if (report.status !== 'resolved') {
      res.status(400).json({
        success: false,
        error: 'Report is not in resolved status',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    report.studentVerification = {
      isResolved,
      feedback,
      verifiedAt: new Date(),
    };

    report.status = isResolved ? 'verified' : 'disputed';

    await report.save();

    // Recalculate SSI
    const accommodation = await Accommodation.findById(report.accommodationId);
    if (accommodation) {
      const reports = await Report.find({ accommodationId: accommodation._id });
      const { ssi } = calculateSSI(reports, accommodation.ssi);
      accommodation.ssi = ssi;
      await accommodation.save();
    }

    res.json({
      success: true,
      data: report,
      message: isResolved ? 'Resolution verified. SSI updated.' : 'Issue disputed. Admin will review.',
    });
  } catch (error) {
    console.error('Verify resolution error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/reports/:id/resolution
// ========================
router.get('/:id/resolution', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findById(req.params.id)
      .select('ownerResponse studentVerification status');

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ownerResponse: report.ownerResponse,
        studentVerification: report.studentVerification,
        status: report.status,
      },
    });
  } catch (error) {
    console.error('Get resolution error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
