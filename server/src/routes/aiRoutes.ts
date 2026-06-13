import express, { Request, Response } from 'express';
import {
  verifyReport,
  getVerificationStatus,
  generateVoice,
  getCachedVerification
} from '../controllers/aiController.js';
import { translateText, translateSSISummary, translateSafetyBriefing, SUPPORTED_LANGUAGES } from '../services/ai/sarvamService.js';
import { generateSpeech, generateSSISummary, generateSafetyBriefing } from '../services/voice/elevenLabsService.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = express.Router();

// ========================
// AI Verification endpoints
// ========================
router.post('/verify', verifyReport);
router.get('/status', getVerificationStatus);
router.get('/cached/:reportType/:reportId?', getCachedVerification);

// ========================
// Sarvam AI Translation endpoints
// ========================

// GET /api/ai/languages — list supported languages
router.get('/languages', (req: Request, res: Response) => {
  sendSuccess(res, SUPPORTED_LANGUAGES);
});

// POST /api/ai/translate — translate arbitrary text
router.post('/translate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, sourceLanguage = 'en', targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      sendError(res, 'text and targetLanguage are required', 400, 'VALIDATION_ERROR');
      return;
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      sendError(res, `Unsupported language: ${targetLanguage}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`, 400, 'VALIDATION_ERROR');
      return;
    }

    const result = await translateText(text, sourceLanguage, targetLanguage);
    sendSuccess(res, result);
  } catch (error) {
    console.error('Translation error:', error);
    sendError(res, 'Translation failed', 500, 'DATABASE_ERROR');
  }
});

// POST /api/ai/translate/ssi — translate SSI summary
router.post('/translate/ssi', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { accommodationName, ssi, riskLevel, targetLanguage } = req.body;

    if (!accommodationName || ssi === undefined || !riskLevel || !targetLanguage) {
      sendError(res, 'accommodationName, ssi, riskLevel, and targetLanguage are required', 400, 'VALIDATION_ERROR');
      return;
    }

    const translatedText = await translateSSISummary(accommodationName, ssi, riskLevel, targetLanguage);
    sendSuccess(res, { translatedText, targetLanguage });
  } catch (error) {
    console.error('SSI translation error:', error);
    sendError(res, 'Translation failed', 500, 'DATABASE_ERROR');
  }
});

// POST /api/ai/translate/briefing — translate safety briefing
router.post('/translate/briefing', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { accommodationName, highSeverityReports, targetLanguage } = req.body;

    if (!accommodationName || !targetLanguage) {
      sendError(res, 'accommodationName and targetLanguage are required', 400, 'VALIDATION_ERROR');
      return;
    }

    const translatedText = await translateSafetyBriefing(
      accommodationName,
      highSeverityReports || [],
      targetLanguage
    );
    sendSuccess(res, { translatedText, targetLanguage });
  } catch (error) {
    console.error('Briefing translation error:', error);
    sendError(res, 'Translation failed', 500, 'DATABASE_ERROR');
  }
});

// ========================
// ElevenLabs Voice endpoints
// ========================

// POST /api/ai/voice — generate speech from text
router.post('/voice', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, type, accommodationName, ssi, riskLevel } = req.body;

    let audioBuffer: Buffer;

    if (type === 'ssi_summary' && accommodationName && ssi !== undefined && riskLevel) {
      audioBuffer = await generateSSISummary(accommodationName, ssi, riskLevel);
    } else if (type === 'safety_briefing' && accommodationName && req.body.reports) {
      audioBuffer = await generateSafetyBriefing(accommodationName, req.body.reports);
    } else if (text) {
      audioBuffer = await generateSpeech(text);
    } else {
      sendError(res, 'Missing text or SSI summary parameters', 400, 'VALIDATION_ERROR');
      return;
    }

    // Return audio as base64 for JSON response
    const audioBase64 = audioBuffer.toString('base64');
    sendSuccess(res, { audio: audioBase64, format: 'mp3' });
  } catch (error) {
    console.error('Voice generation error:', error);
    sendError(res, 'Voice generation failed', 500, 'DATABASE_ERROR');
  }
});

// POST /api/ai/voice/stream — stream audio directly
router.post('/voice/stream', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, type, accommodationName, ssi, riskLevel } = req.body;

    let audioBuffer: Buffer;

    if (type === 'ssi_summary' && accommodationName && ssi !== undefined && riskLevel) {
      audioBuffer = await generateSSISummary(accommodationName, ssi, riskLevel);
    } else if (text) {
      audioBuffer = await generateSpeech(text);
    } else {
      sendError(res, 'Missing text or SSI summary parameters', 400, 'VALIDATION_ERROR');
      return;
    }

    // Stream audio directly
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Content-Disposition': 'inline; filename="speech.mp3"',
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('Voice stream error:', error);
    sendError(res, 'Voice generation failed', 500, 'DATABASE_ERROR');
  }
});

export default router;
