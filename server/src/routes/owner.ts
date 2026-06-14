import { Router, Response } from 'express';
import multer from 'multer';
import { Accommodation } from '../models/Accommodation.js';
import { Report } from '../models/Report.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { ownerMiddleware } from '../middleware/ownerMiddleware.js';
import { cloudinary } from '../config/cloudinary.js';
import { calculateSSI } from '../utils/trustScore.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require verified owner
router.use(authMiddleware);
router.use(ownerMiddleware);

// ========================
// GET /api/owner/stats
// ========================
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?._id;

    // First get accommodations, then get reports
    const accommodations = await Accommodation.find({ ownerId });
    const accommodationIds = accommodations.map((a: any) => a._id);

    const reports = await Report.find({
      accommodationId: { $in: accommodationIds },
    });

    const totalReports = reports.length;
    const pendingReports = reports.filter((r: any) => r.status === 'pending').length;
    const resolvedReports = reports.filter((r: any) => ['resolved', 'verified'].includes(r.status)).length;
    const avgSSI = accommodations.length > 0
      ? accommodations.reduce((sum: number, a: any) => sum + a.ssi, 0) / accommodations.length
      : 0;

    res.json({
      success: true,
      data: {
        totalAccommodations: accommodations.length,
        totalReports,
        pendingReports,
        resolvedReports,
        averageSSI: Math.round(avgSSI * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Get owner stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/owner/accommodations
// ========================
router.get('/accommodations', async (req: AuthRequest, res: Response) => {
  try {
    const accommodations = await Accommodation.find({ ownerId: req.user?._id })
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: accommodations,
    });
  } catch (error) {
    console.error('Get owner accommodations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/owner/accommodations
// ========================
router.post('/accommodations', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, type, address, area, city = 'Hyderabad', state = 'Telangana',
      pincode, location, amenities, capacity, monthlyRent,
      contactPhone, contactEmail, images,
    } = req.body;

    if (!name || !type || !address || !area || !pincode) {
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
        coordinates: location?.coordinates || [78.4867, 17.3850],
      },
      latitude: location?.coordinates?.[1] || 17.3850,
      longitude: location?.coordinates?.[0] || 78.4867,
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
// PUT /api/owner/accommodations/:id
// ========================
router.put('/accommodations/:id', async (req: AuthRequest, res: Response) => {
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

    if (accommodation.ownerId.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized',
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
// DELETE /api/owner/accommodations/:id
// ========================
router.delete('/accommodations/:id', async (req: AuthRequest, res: Response) => {
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

    if (accommodation.ownerId.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized',
        code: 'FORBIDDEN',
      });
      return;
    }

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
// PUT /api/owner/accommodations/:id/occupancy
// ========================
router.put('/accommodations/:id/occupancy', async (req: AuthRequest, res: Response) => {
  try {
    const { currentOccupancy } = req.body;

    const accommodation = await Accommodation.findById(req.params.id);

    if (!accommodation) {
      res.status(404).json({
        success: false,
        error: 'Accommodation not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    if (accommodation.ownerId.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized',
        code: 'FORBIDDEN',
      });
      return;
    }

    accommodation.currentOccupancy = currentOccupancy;
    await accommodation.save();

    res.json({
      success: true,
      data: {
        currentOccupancy: accommodation.currentOccupancy,
        capacity: accommodation.capacity,
      },
    });
  } catch (error) {
    console.error('Update occupancy error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/owner/reports
// ========================
router.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    const ownerAccommodations = await Accommodation.find({ ownerId: req.user?._id }).select('_id');
    const accommodationIds = ownerAccommodations.map((a: any) => a._id);

    const reports = await Report.find({
      accommodationId: { $in: accommodationIds },
    })
      .populate('accommodationId', 'name area')
      .populate('userId', 'name college')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Get owner reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// PUT /api/owner/reports/:id/resolve
// ========================
router.put('/reports/:id/resolve', upload.array('proofImages', 5), async (req: AuthRequest, res: Response) => {
  try {
    const { response } = req.body;
    const files = req.files as Express.Multer.File[];

    const report = await Report.findById(req.params.id);

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Verify owner owns the accommodation
    const accommodation = await Accommodation.findById(report.accommodationId);
    if (!accommodation || accommodation.ownerId.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized',
        code: 'FORBIDDEN',
      });
      return;
    }

    // Upload proof images
    let proofImageUrls: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const b64 = file.buffer.toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'safestay/resolutions',
        });
        return result.secure_url;
      });
      proofImageUrls = await Promise.all(uploadPromises);
    }

    report.ownerResponse = {
      response,
      proofImages: proofImageUrls,
      respondedAt: new Date(),
    };
    report.status = 'resolved';

    await report.save();

    res.json({
      success: true,
      data: report,
      message: 'Response submitted. Awaiting student verification.',
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/owner/counter-report
// ========================
router.post('/counter-report', async (req: AuthRequest, res: Response) => {
  try {
    const { reportId, reason, description, evidence } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Verify owner owns the accommodation
    const accommodation = await Accommodation.findById(report.accommodationId);
    if (!accommodation || accommodation.ownerId.toString() !== req.user?._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized',
        code: 'FORBIDDEN',
      });
      return;
    }

    report.counterReport = {
      reason,
      description,
      evidence: evidence || [],
      submittedAt: new Date(),
      status: 'pending',
    };

    await report.save();

    res.json({
      success: true,
      data: report,
      message: 'Counter-report submitted. Awaiting admin review.',
    });
  } catch (error) {
    console.error('Counter-report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/owner/counter-reports
// ========================
router.get('/counter-reports', async (req: AuthRequest, res: Response) => {
  try {
    const ownerAccommodations = await Accommodation.find({ ownerId: req.user?._id }).select('_id');
    const accommodationIds = ownerAccommodations.map((a: any) => a._id);

    const reports = await Report.find({
      accommodationId: { $in: accommodationIds },
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

export default router;
