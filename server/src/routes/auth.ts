import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { sendEmail } from '../utils/emailService.js';
import { otpEmailTemplate, welcomeEmailTemplate } from '../utils/emailTemplates.js';
import { isCollegeEmail, extractCollegeFromEmail } from '../utils/collegeVerification.js';
import { cloudinary } from '../config/cloudinary.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { JWT_CONFIG } from '../config/constants.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: JWT_CONFIG.EXPIRES_IN });
};

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ========================
// POST /api/auth/signup
// ========================
router.post('/signup', authLimiter, validate({
  email: { required: true, type: 'string' },
  password: { required: true, type: 'string', minLength: 8 },
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  phone: { required: true, type: 'string' },
  role: { required: false, type: 'string', enum: ['student', 'owner'] as readonly string[] },
}), async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role = 'student', college, studentId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      sendError(res, 'Email already registered', 400, 'DUPLICATE');
      return;
    }

    // Check college email for students
    if (role === 'student' && !isCollegeEmail(email)) {
      sendError(res, 'Please use a valid college email address', 400, 'VALIDATION_ERROR');
      return;
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
      isVerified: role === 'student' && isCollegeEmail(email),
    });

    await user.save();

    const token = generateToken(user._id.toString());

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: 'Welcome to SafeStay!',
      html: welcomeEmailTemplate(user.name),
    });

    sendSuccess(res, {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
      token,
    }, 'Registration successful', 201);
  } catch (error) {
    console.error('Signup error:', error);
    sendError(res, 'Server error during registration', 500, 'DATABASE_ERROR');
  }
});

// ========================
// POST /api/auth/login
// ========================
router.post('/login', authLimiter, validate({
  email: { required: true, type: 'string' },
  password: { required: true, type: 'string' },
}), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      sendError(res, 'Invalid email or password', 401, 'UNAUTHORIZED');
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      sendError(res, 'Invalid email or password', 401, 'UNAUTHORIZED');
      return;
    }

    // Check if banned
    if (user.isBanned) {
      sendError(res, 'Account has been banned', 403, 'FORBIDDEN');
      return;
    }

    const token = generateToken(user._id.toString());

    sendSuccess(res, {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        college: user.college,
        isVerified: user.isVerified,
        ownerVerification: user.ownerVerification,
      },
      token,
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Server error during login', 500, 'DATABASE_ERROR');
  }
});

// ========================
// POST /api/auth/register-owner
// ========================
router.post('/register-owner', authLimiter, upload.fields([
  { name: 'governmentId', maxCount: 1 },
  { name: 'propertyProof', maxCount: 1 },
  { name: 'businessRegistration', maxCount: 1 },
]), validate({
  email: { required: true, type: 'string' },
  password: { required: true, type: 'string', minLength: 8 },
  name: { required: true, type: 'string', minLength: 2 },
  phone: { required: true, type: 'string' },
}), async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      sendError(res, 'Email already registered', 400, 'DUPLICATE');
      return;
    }

    // Upload documents to Cloudinary
    const files = (req.files || {}) as { [fieldname: string]: Express.Multer.File[] };
    const uploadPromises: Promise<string>[] = [];

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

    sendSuccess(res, {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        ownerVerification: user.ownerVerification,
      },
      token,
    }, 'Owner registration successful. Pending admin verification.', 201);
  } catch (error) {
    console.error('Owner registration error:', error);
    sendError(res, 'Server error during registration', 500, 'DATABASE_ERROR');
  }
});

// ========================
// GET /api/auth/me
// ========================
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      sendError(res, 'User not found', 404, 'NOT_FOUND');
      return;
    }

    sendSuccess(res, {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      college: user.college,
      studentId: user.studentId,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      profilePhoto: user.profilePhoto,
      ownerVerification: user.ownerVerification,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
  }
});

// ========================
// GET /api/auth/owner/verification-status
// ========================
router.get('/owner/verification-status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('ownerVerification role');

    if (!user || user.role !== 'owner') {
      sendError(res, 'Not an owner account', 400, 'VALIDATION_ERROR');
      return;
    }

    sendSuccess(res, {
      status: user.ownerVerification.status,
      rejectionReason: user.ownerVerification.rejectionReason,
      verifiedAt: user.ownerVerification.verifiedAt,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    sendError(res, 'Server error', 500, 'DATABASE_ERROR');
  }
});

export default router;
