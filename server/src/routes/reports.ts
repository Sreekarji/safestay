import { Router, Response } from 'express';
import { Report } from '../models/Report.js';
import { Accommodation } from '../models/Accommodation.js';
import { VerificationResult } from '../models/VerificationResult.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { reportLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { verifyReport } from '../utils/aiVerification.js';
import { calculateSSI } from '../utils/trustScore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { SEVERITY, REPORT_CATEGORIES } from '../config/constants.js';

const router = Router();

// ========================
// POST /api/reports
// ========================
router.post('/', authMiddleware, reportLimiter, validate({
  accommodationId: { required: true, type: 'string' },
  category: { required: true, type: 'string', enum: REPORT_CATEGORIES },
  severity: { required: true, type: 'number', min: SEVERITY.MIN, max: SEVERITY.MAX },
  title: { required: true, type: 'string', minLength: 5, maxLength: 200 },
  description: { required: true, type: 'string', minLength: 10, maxLength: 2000 },
}), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user || user.role !== 'student') {
      sendError(res, 'Only verified students can submit reports', 403, 'FORBIDDEN');
      return;
    }

    if (!user.isVerified) {
      sendError(res, 'Please verify your email before submitting reports', 403, 'FORBIDDEN');
      return;
    }

    const {
      accommodationId, category, severity, title, description,
      images = [], isAnonymous = false,
    } = req.body;

    // Check accommodation exists
    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) {
      sendError(res, 'Accommodation not found', 404, 'NOT_FOUND');
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

      if (aiResult.mistral) {
        await VerificationResult.create({
          reportId: report._id,
          modelName: 'mistral',
          verdict: aiResult.mistral.verdict,
          confidence: aiResult.mistral.confidence,
          reasoning: aiResult.mistral.reasoning,
          processingTime: 0,
        });
      }

      // Recalculate SSI
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

    sendSuccess(res, {
      _id: report._id,
      accommodationId: report.accommodationId,
      category: report.category,
      severity: report.severity,
      title: report.title,
      status: report.status,
      isAnonymous: report.isAnonymous,
    }, 'Report submitted. AI verification in progress.', 201);
  } catch (error) {
    console.error('Create report error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
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

    const total = await Report.countDocuments(query);
    const { page: p, limit: l, skip } = parsePagination({ page, limit }, total);

    const reports = await Report.find(query)
      .populate('accommodationId', 'name area ssi')
      .populate('userId', 'name college isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l);

    sendSuccess(res, { reports, pagination: buildPaginationMeta(total, p, l) });
  } catch (error) {
    console.error('Get reports error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
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

    const total = await Report.countDocuments(query);
    const { page: p, limit: l, skip } = parsePagination({ page, limit }, total);

    const reports = await Report.find(query)
      .populate('accommodationId', 'name area ssi')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l);

    sendSuccess(res, { reports, pagination: buildPaginationMeta(total, p, l) });
  } catch (error) {
    console.error('Get my reports error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
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
      sendError(res, 'Report not found', 404, 'NOT_FOUND');
      return;
    }

    sendSuccess(res, report);
  } catch (error) {
    console.error('Get report error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
  }
});

// ========================
// PUT /api/reports/:id
// ========================
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      sendError(res, 'Report not found', 404, 'NOT_FOUND');
      return;
    }

    if (report.userId.toString() !== req.user?._id.toString()) {
      sendError(res, 'Not authorized to update this report', 403, 'FORBIDDEN');
      return;
    }

    const { title, description, severity, category, images } = req.body;

    if (title) report.title = title;
    if (description) report.description = description;
    if (severity) report.severity = severity;
    if (category) report.category = category;

    // If images changed, re-run AI verification
    if (images && JSON.stringify(images) !== JSON.stringify(report.images)) {
      report.images = images;
      report.status = 'pending';

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

    sendSuccess(res, report, 'Report updated successfully');
  } catch (error) {
    console.error('Update report error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
  }
});

// ========================
// DELETE /api/reports/:id
// ========================
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      sendError(res, 'Report not found', 404, 'NOT_FOUND');
      return;
    }

    if (report.userId.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      sendError(res, 'Not authorized to delete this report', 403, 'FORBIDDEN');
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

    sendSuccess(res, null, 'Report deleted successfully');
  } catch (error) {
    console.error('Delete report error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
  }
});

// ========================
// POST /api/reports/:id/upvote
// ========================
router.post('/:id/upvote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      sendError(res, 'Report not found', 404, 'NOT_FOUND');
      return;
    }

    if (report.userId.toString() === req.user?._id.toString()) {
      sendError(res, 'Cannot upvote your own report', 400, 'VALIDATION_ERROR');
      return;
    }

    const userId = req.user?._id;
    const upvoteIndex = report.upvotedBy.indexOf(userId);

    if (upvoteIndex > -1) {
      report.upvotedBy.splice(upvoteIndex, 1);
      report.upvotes = Math.max(0, report.upvotes - 1);
    } else {
      report.upvotedBy.push(userId);
      report.upvotes += 1;
    }

    await report.save();

    // Recalculate SSI
    const accommodation = await Accommodation.findById(report.accommodationId);
    if (accommodation) {
      const reports = await Report.find({ accommodationId: accommodation._id });
      const { ssi } = calculateSSI(reports, accommodation.ssi);
      accommodation.ssi = ssi;
      await accommodation.save();
    }

    sendSuccess(res, { upvotes: report.upvotes, upvoted: upvoteIndex === -1 });
  } catch (error) {
    console.error('Upvote error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
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
      sendError(res, 'Report not found', 404, 'NOT_FOUND');
      return;
    }

    if (report.userId.toString() !== req.user?._id.toString()) {
      sendError(res, 'Not authorized to verify this resolution', 403, 'FORBIDDEN');
      return;
    }

    if (report.status !== 'resolved') {
      sendError(res, 'Report is not in resolved status', 400, 'VALIDATION_ERROR');
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

    sendSuccess(res, report, isResolved ? 'Resolution verified. SSI updated.' : 'Issue disputed. Admin will review.');
  } catch (error) {
    console.error('Verify resolution error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
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
      sendError(res, 'Report not found', 404, 'NOT_FOUND');
      return;
    }

    sendSuccess(res, {
      ownerResponse: report.ownerResponse,
      studentVerification: report.studentVerification,
      status: report.status,
    });
  } catch (error) {
    console.error('Get resolution error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
  }
});

export default router;
