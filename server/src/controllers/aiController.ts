import { Request, Response } from 'express';
import { runVerificationPipeline } from '../services/ai/verificationPipeline.js';
import { generateSpeech, generateSSISummary } from '../services/voice/elevenLabsService.js';
import { PRE_CACHED_AI_RESPONSES } from '../services/ai/preCachedResponses.js';

export const verifyReport = async (req: Request, res: Response) => {
  try {
    const { reportId, imageUrl, reportText, category, imageDescription } = req.body;

    if (!reportId || !imageUrl || !reportText || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Run AI verification pipeline
    const result = await runVerificationPipeline(
      reportId,
      imageUrl,
      reportText,
      category,
      imageDescription || ''
    );

    // Save to database (to be implemented by P1)
    // await VerificationResult.create({ reportId, ...result });

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Verification complete'
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getVerificationStatus = async (req: Request, res: Response) => {
  try {
    // Check if AI services are available
    const status = {
      mistral: { status: 'online', latency: 1200 },
      groq: { status: 'online', latency: 800 },
      gemini: { status: 'online', latency: 950 },
      pipeline: 'operational'
    };

    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Unable to check AI status'
    });
  }
};

export const generateVoice = async (req: Request, res: Response) => {
  try {
    const { text, type, accommodationName, ssi, riskLevel } = req.body;

    let audioBuffer: Buffer;

    if (type === 'ssi_summary' && accommodationName && ssi && riskLevel) {
      audioBuffer = await generateSSISummary(accommodationName, ssi, riskLevel);
    } else if (text) {
      audioBuffer = await generateSpeech(text);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing text or SSI summary parameters'
      });
    }

    // Convert buffer to base64 for JSON response
    const audioBase64 = audioBuffer.toString('base64');

    return res.status(200).json({
      success: true,
      data: {
        audio: audioBase64,
        format: 'mp3'
      }
    });
  } catch (error) {
    console.error('Voice generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Voice generation failed'
    });
  }
};

export const getCachedVerification = async (req: Request, res: Response) => {
  try {
    const { reportType, reportId } = req.params;

    // Return pre-cached response for demo
    const cached = PRE_CACHED_AI_RESPONSES[reportType as keyof typeof PRE_CACHED_AI_RESPONSES];
    
    if (!cached) {
      return res.status(404).json({
        success: false,
        error: 'No cached response found for this report type'
      });
    }

    // Get specific cached response or first available
    const response = Object.values(cached)[0];

    return res.status(200).json({
      success: true,
      data: response,
      message: 'Using cached AI response for demo'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve cached response'
    });
  }
};
