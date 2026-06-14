import { Router, Response } from 'express';
import { Accommodation } from '../models/Accommodation.js';
import { Report } from '../models/Report.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { ownerMiddleware } from '../middleware/ownerMiddleware.js';
import { calculateSSI, getTrustScoreLabel, getTrustScoreColor } from '../utils/trustScore.js';

const router = Router();

// ========================
// GET /api/accommodations
// ========================
router.get('/', async (req, res: Response) => {
  try {
    const { area, type, minSSI, maxSSI, search, limit = 20, page = 1 } = req.query;

    const query: any = { isActive: true };

    if (area) query.area = area;
    if (type) query.type = type;
    if (minSSI || maxSSI) {
      query.ssi = {};
      if (minSSI) query.ssi.$gte = Number(minSSI);
      if (maxSSI) query.ssi.$lte = Number(maxSSI);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [accommodations, total] = await Promise.all([
      Accommodation.find(query)
        .select('_id name address city description amenities totalRooms occupiedRooms pricePerMonth contactPhone type latitude longitude trustScore trustScoreLabel trustScoreColor totalReports isVerified riskScore createdAt ssi')
        .sort({ trustScore: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Accommodation.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        accommodations,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get accommodations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/accommodations/dropdown
// ========================
router.get('/dropdown', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const accommodations = await Accommodation.find({ isActive: true })
      .select('name area type ssi')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: accommodations,
    });
  } catch (error) {
    console.error('Get dropdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/accommodations/with-location
// ========================
router.get('/with-location', async (req, res: Response) => {
  try {
    const accommodations = await Accommodation.find({
      isActive: true,
      'location.coordinates': { $exists: true },
    })
      .select('name area type ssi location reportCount categoryScores trustScore trustScoreLabel totalReports latitude longitude')
      .lean();

    // Add risk level to each
    const markers = accommodations.map(acc => ({
      ...acc,
      riskLevel: acc.ssi >= 80 ? 'low' : acc.ssi >= 50 ? 'medium' : 'high',
    }));

    res.json({
      success: true,
      data: markers,
    });
  } catch (error) {
    console.error('Get map data error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/accommodations/:id
// ========================
router.get('/:id', async (req, res: Response) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id)
      .populate('ownerId', 'name phone')
      .populate('owner', 'name phone')
      .select('-__v');

    if (!accommodation) {
      res.status(404).json({
        success: false,
        error: 'Accommodation not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Get approved reports for this accommodation
    const reports = await Report.find({
      accommodationId: accommodation._id,
      status: { $in: ['ai_verified', 'approved', 'resolved', 'verified'] },
    })
      .populate('userId', 'name college isVerified collegeName')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        ...accommodation.toObject(),
        reports,
      },
    });
  } catch (error) {
    console.error('Get accommodation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/accommodations
// ========================
router.post('/', authMiddleware, ownerMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, type, address, area, city = 'Hyderabad', state = 'Telangana',
      pincode, location, amenities, capacity, monthlyRent,
      contactPhone, contactEmail, images,
    } = req.body;

    if (!name || !type || !address || !area || !pincode || !location) {
      res.status(400).json({
        success: false,
        error: 'Please provide all required fields',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const accommodation = new Accommodation({
      name,
      type,
      address,
      area,
      city,
      state,
      pincode,
      location: {
        type: 'Point',
        coordinates: location.coordinates || [78.4867, 17.3850], // Default Hyderabad
      },
      latitude: location.coordinates?.[1] || 17.3850,
      longitude: location.coordinates?.[0] || 78.4867,
      ownerId: req.user?._id,
      owner: req.user?._id,
      amenities: amenities || [],
      capacity,
      totalRooms: capacity,
      monthlyRent,
      pricePerMonth: monthlyRent,
      contactPhone,
      contactEmail,
      images: images || [],
    });

    await accommodation.save();

    res.status(201).json({
      success: true,
      data: accommodation,
      message: 'Accommodation created successfully',
    });
  } catch (error) {
    console.error('Create accommodation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/accommodations/:id
// ========================
router.put('/:id', authMiddleware, ownerMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id);

    if (!accommodation) {
      res.status(404).json({
        success: false,
        error: 'Accommodation not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Check ownership
    if (accommodation.ownerId.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this accommodation',
        code: 'FORBIDDEN',
      });
      return;
    }

    const updated = await Accommodation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updated,
      message: 'Accommodation updated successfully',
    });
  } catch (error) {
    console.error('Update accommodation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// DELETE /api/accommodations/:id
// ========================
router.delete('/:id', authMiddleware, ownerMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id);

    if (!accommodation) {
      res.status(404).json({
        success: false,
        error: 'Accommodation not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Check ownership
    if (accommodation.ownerId.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this accommodation',
        code: 'FORBIDDEN',
      });
      return;
    }

    // Soft delete
    accommodation.isActive = false;
    await accommodation.save();

    res.json({
      success: true,
      message: 'Accommodation deleted successfully',
    });
  } catch (error) {
    console.error('Delete accommodation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/accommodations/:id/recalculate-score
// ========================
router.post('/:id/recalculate-score', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id);

    if (!accommodation) {
      res.status(404).json({
        success: false,
        error: 'Accommodation not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Get all reports for this accommodation
    const reports = await Report.find({ accommodationId: accommodation._id });

    // Calculate new SSI
    const { ssi, categoryScores } = calculateSSI(reports, accommodation.ssi);

    // Update accommodation
    accommodation.ssi = ssi;
    accommodation.categoryScores = categoryScores as any;
    accommodation.reportCount = reports.length;
    accommodation.totalReports = reports.length;
    accommodation.verifiedReportCount = reports.filter((r: any) =>
      ['ai_verified', 'approved', 'resolved', 'verified'].includes(r.status)
    ).length;
    accommodation.trustScore = ssi;
    accommodation.trustScoreLabel = getTrustScoreLabel(ssi);
    accommodation.trustScoreColor = getTrustScoreColor(ssi);
    accommodation.riskScore = 100 - ssi;

    // Add to SSI history
    accommodation.ssiHistory.push({
      score: ssi,
      date: new Date(),
      reportCount: reports.length,
    });

    await accommodation.save();

    res.json({
      success: true,
      data: {
        ssi,
        categoryScores,
        reportCount: accommodation.reportCount,
      },
      message: 'SSI recalculated successfully',
    });
  } catch (error) {
    console.error('Recalculate SSI error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
