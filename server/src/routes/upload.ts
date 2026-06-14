import { Router, Response } from 'express';
import multer from 'multer';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ========================
// POST /api/upload
// ========================
router.post('/', authMiddleware, uploadLimiter, upload.array('images', 5), async (req: AuthRequest, res: Response) => {
  try {
    if (!isCloudinaryConfigured()) {
      res.status(500).json({
        success: false,
        error: 'Image upload service is not configured. Please contact admin.',
        code: 'SERVICE_UNAVAILABLE',
      });
      return;
    }

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No images provided',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Upload all images to Cloudinary in parallel
    const uploadPromises = files.map(async (file) => {
      const b64 = file.buffer.toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'safestay/reports',
        resource_type: 'auto',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: {
        images: uploadedImages.map(img => img.url),
        publicIds: uploadedImages.map(img => img.publicId),
      },
      message: `${uploadedImages.length} image(s) uploaded successfully`,
    });
  } catch (error: any) {
    console.error('Upload error:', error);

    // Cloudinary API errors (invalid credentials, account issues, etc.)
    if (error?.http_code) {
      res.status(error.http_code === 401 || error.http_code === 403 ? 500 : error.http_code).json({
        success: false,
        error: error.message || 'Image storage service error. Please contact admin.',
        code: 'CLOUDINARY_ERROR',
      });
      return;
    }

    // Multer errors
    if (error?.name === 'MulterError') {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: 'File size too large. Maximum 5MB allowed.',
          code: 'UPLOAD_ERROR',
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: error?.message || 'Upload failed. Please try again.',
      code: 'UPLOAD_ERROR',
    });
  }
});

// ========================
// DELETE /api/upload/:publicId
// ========================
router.delete('/:publicId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    // Decode the public ID (it may contain slashes)
    const decodedPublicId = decodeURIComponent(publicId);

    await cloudinary.uploader.destroy(decodedPublicId);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image',
      code: 'UPLOAD_ERROR',
    });
  }
});

export default router;
