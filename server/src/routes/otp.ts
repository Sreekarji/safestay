import { Router, Request, Response } from 'express';
import { OTP } from '../models/OTP.js';
import { User } from '../models/User.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { sendEmail } from '../utils/emailService.js';
import { otpEmailTemplate } from '../utils/emailTemplates.js';

const router = Router();

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ========================
// POST /api/otp/send-verification
// ========================
router.post('/send-verification', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        error: 'Email already verified',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Delete existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'verification' });

    // Generate and save OTP
    const otp = generateOTP();
    const otpDoc = new OTP({
      email: email.toLowerCase(),
      otp,
      purpose: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });
    await otpDoc.save();

    // Send OTP email
    await sendEmail({
      to: email,
      subject: 'SafeStay - Verify Your Email',
      html: otpEmailTemplate(otp, 'verification'),
    });

    res.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/otp/verify-email
// ========================
router.post('/verify-email', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'verification',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      res.status(400).json({
        success: false,
        error: 'OTP expired or not found',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Verify OTP
    if (otpDoc.otp !== otp) {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Update user verification status
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isVerified: true }
    );

    // Delete used OTP
    await OTP.deleteOne({ _id: otpDoc._id });

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/otp/send-college-verification
// ========================
router.post('/send-college-verification', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        error: 'Already verified',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Delete existing OTPs
    await OTP.deleteMany({ email: user.email, purpose: 'verification' });

    // Generate and save OTP
    const otp = generateOTP();
    const otpDoc = new OTP({
      email: user.email,
      otp,
      purpose: 'verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await otpDoc.save();

    // Send OTP
    await sendEmail({
      to: user.email,
      subject: 'SafeStay - College Verification',
      html: otpEmailTemplate(otp, 'verification'),
    });

    res.json({
      success: true,
      message: 'OTP sent to your college email',
    });
  } catch (error) {
    console.error('Send college OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/otp/verify-college
// ========================
router.post('/verify-college', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!otp) {
      res.status(400).json({
        success: false,
        error: 'OTP is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      email: user.email,
      purpose: 'verification',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      res.status(400).json({
        success: false,
        error: 'OTP expired or not found',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (otpDoc.otp !== otp) {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Update user
    await User.findByIdAndUpdate(user._id, { isVerified: true });

    // Delete used OTP
    await OTP.deleteOne({ _id: otpDoc._id });

    res.json({
      success: true,
      message: 'College email verified successfully',
    });
  } catch (error) {
    console.error('Verify college OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/otp/forgot-password
// ========================
router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists
      res.json({
        success: true,
        message: 'If the email exists, an OTP has been sent',
      });
      return;
    }

    // Delete existing OTPs
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'forgot_password' });

    // Generate and save OTP
    const otp = generateOTP();
    const otpDoc = new OTP({
      email: email.toLowerCase(),
      otp,
      purpose: 'forgot_password',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await otpDoc.save();

    // Send OTP
    await sendEmail({
      to: email,
      subject: 'SafeStay - Password Reset',
      html: otpEmailTemplate(otp, 'forgot_password'),
    });

    res.json({
      success: true,
      message: 'If the email exists, an OTP has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

// ========================
// POST /api/otp/reset-password
// ========================
router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Email, OTP, and new password are required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'forgot_password',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      res.status(400).json({
        success: false,
        error: 'OTP expired or not found',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (otpDoc.otp !== otp) {
      res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Update password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.password = newPassword;
      await user.save(); // Password will be hashed by pre-save hook
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpDoc._id });

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      code: 'DATABASE_ERROR',
    });
  }
});

export default router;
