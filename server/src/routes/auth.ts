import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { sendEmail } from '../utils/emailService.js';
import { otpEmailTemplate, welcomeEmailTemplate } from '../utils/emailTemplates.js';
import { isCollegeEmail, extractCollegeFromEmail } from '../utils/collegeVerification.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ========================
// POST /api/auth/signup
// ========================
router.post('/signup', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role = 'student', college, studentId } = req.body;

    // Validation
    if (!email || !password || !name || !phone) {
      res.status(400).json({
        success: false,
        error: 'Please provide email, password, name, and phone',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Email already registered',
        code: 'DUPLICATE',
      });
      return;
    }

    // Check college email for students
    if (role === 'student') {
      if (!isCollegeEmail(email)) {
        res.status(400).json({
          success: false,
          error: 'Please use a valid college email address',
          code: 'VALIDATION_ERROR',
        });
        return;
      }
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      phone,
      role,
      college: college || extractCollegeFromEmail(email),
      studentId,
      isVerified: role === 'student' && isCollegeEmail(email), // Auto-verify college emails
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: 'Welcome to SafeStay!',
      html: welcomeEmailTemplate(user.name),
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
      },
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/auth/login
// ========================
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide email and password',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Check if banned
    if (user.isBanned) {
      res.status(403).json({
        success: false,
        error: 'Account has been banned',
        code: 'FORBIDDEN',
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          college: user.college,
          collegeName: user.collegeName,
          isVerified: user.isVerified,
          isCollegeVerified: user.isCollegeVerified,
          ownerVerification: user.ownerVerification,
        },
        token,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/auth/register-owner
// ========================
router.post('/register-owner', authLimiter, upload.fields([
  { name: 'governmentId', maxCount: 1 },
  { name: 'propertyProof', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name || !phone) {
      res.status(400).json({
        success: false,
        error: 'Please provide all required fields',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Email already registered',
        code: 'DUPLICATE',
      });
      return;
    }

    // Upload documents to Cloudinary
    const files = (req.files || {}) as { [fieldname: string]: Express.Multer.File[] };
    const uploadPromises: Promise<string>[] = [];

    console.log('[register-owner] isCloudinaryConfigured:', isCloudinaryConfigured());
    console.log('[register-owner] cloudinary.uploader:', typeof cloudinary.uploader);
    console.log('[register-owner] files:', Object.keys(files));

    if (isCloudinaryConfigured()) {
      for (const field of ['governmentId', 'propertyProof', 'businessRegistration']) {
        if (files[field]?.[0]) {
          const b64 = files[field][0].buffer.toString('base64');
          const dataURI = `data:${files[field][0].mimetype};base64,${b64}`;
          uploadPromises.push(
            cloudinary.uploader.upload(dataURI, {
              folder: 'safestay/owner-documents',
              resource_type: 'auto',
            }).then(result => result.secure_url)
          );
        }
      }
    } else {
      console.warn('⚠️ Cloudinary not configured — skipping document uploads');
    }

    let uploadedUrls: string[] = [];
    try {
      uploadedUrls = await Promise.all(uploadPromises);
    } catch (uploadErr) {
      console.error('Document upload failed (non-blocking):', uploadErr);
      // Continue registration without documents
    }

    // Create owner user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      phone,
      role: 'owner',
      ownerVerification: {
        status: 'pending',
        documents: {
          governmentId: uploadedUrls[0] || undefined,
          propertyProof: uploadedUrls[1] || undefined,
          businessRegistration: uploadedUrls[2] || undefined,
        },
      },
    });

    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          ownerVerification: user.ownerVerification,
        },
        token,
      },
      message: 'Owner registration successful. Pending admin verification.',
    });
  } catch (error) {
    console.error('Owner registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/auth/me
// ========================
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);

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
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        college: user.college,
        collegeName: user.collegeName,
        studentId: user.studentId,
        isVerified: user.isVerified,
        isCollegeVerified: user.isCollegeVerified,
        isBanned: user.isBanned,
        profilePhoto: user.profilePhoto,
        notificationPrefs: user.notificationPrefs,
        ownerVerification: user.ownerVerification,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// GET /api/auth/owner/verification-status
// ========================
router.get('/owner/verification-status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('ownerVerification role');

    if (!user || user.role !== 'owner') {
      res.status(400).json({
        success: false,
        error: 'Not an owner account',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        status: user.ownerVerification.status,
        rejectionReason: user.ownerVerification.rejectionReason,
        verifiedAt: user.ownerVerification.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
