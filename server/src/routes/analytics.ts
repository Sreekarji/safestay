import { Router, Response } from 'express';
import { Report } from '../models/Report.js';
import { Accommodation } from '../models/Accommodation.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// ========================
// GET /api/analytics/dashboard
// ========================
router.get('/dashboard', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const days = Number(req.query.days) || 30;
    const thirtyDaysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [summary, trends, categoryBreakdown, riskDistribution] = await Promise.all([
      // Summary stats
      Promise.all([
        Accommodation.countDocuments({ isActive: true }),
        Report.countDocuments(),
        Report.countDocuments({ status: { $in: ['ai_verified', 'approved', 'resolved', 'verified'] } }),
        Accommodation.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, avgSSI: { $avg: '$ssi' } } },
        ]),
      ]),

      // Trends (reports by day)
      Report.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Category breakdown
      Report.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]),

      // Risk distribution
      Accommodation.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $gte: ['$ssi', 80] }, then: 'low' },
                  { case: { $gte: ['$ssi', 50] }, then: 'medium' },
                ],
                default: 'high',
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalAccommodations: summary[0],
          totalReports: summary[1],
          verifiedReports: summary[2],
          averageSSI: summary[3][0]?.avgSSI || 0,
        },
        trends: {
          reportsByDay: trends,
        },
        categoryBreakdown,
        riskDistribution,
      },
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/analytics/area-risk
// ========================
router.get('/area-risk', async (req, res: Response) => {
  try {
    const areaRisk = await Accommodation.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$area',
          avgSSI: { $avg: '$ssi' },
          accommodationCount: { $sum: 1 },
          totalReports: { $sum: '$reportCount' },
        },
      },
      {
        $project: {
          area: '$_id',
          avgSSI: { $round: ['$avgSSI', 1] },
          accommodationCount: 1,
          totalReports: 1,
          riskLevel: {
            $switch: {
              branches: [
                { case: { $gte: ['$avgSSI', 80] }, then: 'low' },
                { case: { $gte: ['$avgSSI', 50] }, then: 'medium' },
              ],
              default: 'high',
            },
          },
        },
      },
      { $sort: { avgSSI: 1 } },
    ]);

    res.json({
      success: true,
      data: { areas: areaRisk },
    });
  } catch (error) {
    console.error('Get area risk error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/analytics/accommodations/:id/trend
// ========================
router.get('/accommodations/:id/trend', async (req, res: Response) => {
  try {
    const months = Number(req.query.months) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const accommodation = await Accommodation.findById(req.params.id).select('name ssiHistory');

    if (!accommodation) {
      res.status(404).json({
        success: false,
        error: 'Accommodation not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Filter SSI history by date range
    const trend = accommodation.ssiHistory
      .filter(h => h.date >= startDate)
      .map(h => ({
        date: h.date,
        ssi: h.score,
        reports: h.reportCount,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    res.json({
      success: true,
      data: {
        accommodationId: accommodation._id,
        name: accommodation.name,
        trend,
      },
    });
  } catch (error) {
    console.error('Get accommodation trend error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
