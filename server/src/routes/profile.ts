import { Router, Response } from 'express';
import { User } from '../models/User.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// ========================
// GET /api/profile
// ========================
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password -__v');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Server error', code: 'DATABASE_ERROR' });
  }
});

// ========================
// PUT /api/profile
// ========================
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, profilePhoto } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(req.user?._id, updateData, { new: true }).select('-password -__v');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Server error', code: 'DATABASE_ERROR' });
  }
});

// ========================
// PUT /api/profile/password
// ========================
router.put('/password', async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current and new passwords are required', code: 'VALIDATION_ERROR' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters', code: 'VALIDATION_ERROR' });
      return;
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, error: 'Current password is incorrect', code: 'VALIDATION_ERROR' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Server error', code: 'DATABASE_ERROR' });
  }
});

// ========================
// PUT /api/profile/notifications
// ========================
router.put('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const { notificationPrefs } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { notificationPrefs },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ success: false, error: 'Server error', code: 'DATABASE_ERROR' });
  }
});

export default router;
