import express from 'express';
import {
  verifyReport,
  getVerificationStatus,
  generateVoice,
  getCachedVerification
} from '../controllers/aiController';

const router = express.Router();

// AI Verification endpoints
router.post('/verify', verifyReport);
router.get('/status', getVerificationStatus);
router.get('/cached/:reportType/:reportId?', getCachedVerification);

// Voice synthesis endpoints
router.post('/voice', generateVoice);

export default router;
