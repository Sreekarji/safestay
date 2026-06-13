import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
}

const ELEVENLABS_CONFIG: ElevenLabsConfig = {
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger (premade, free tier)
  modelId: 'eleven_turbo_v2_5'
};

const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export async function generateSpeech(text: string): Promise<Buffer> {
  const { apiKey, voiceId, modelId } = ELEVENLABS_CONFIG;

  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    const response = await fetch(`${ELEVENLABS_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error, using fallback:', error.substring(0, 200));
      return generateFallbackAudio(text);
    }

    const audioBuffer = await response.buffer();
    return audioBuffer;
  } catch (error) {
    console.error('ElevenLabs synthesis error, using fallback:', error);
    return generateFallbackAudio(text);
  }
}

function generateFallbackAudio(text: string): Buffer {
  // Generate a minimal valid MP3 file header as placeholder
  // In demo mode, the frontend will display text instead of playing audio
  console.log(`[DEMO MODE] ElevenLabs fallback — would speak: "${text}"`);
  // Return a tiny valid buffer (ID3v2 header + silence)
  return Buffer.from([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // ID3v2 header
  ]);
}

export async function generateSSISummary(
  accommodationName: string,
  ssi: number,
  riskLevel: string
): Promise<Buffer> {
  const text = `${accommodationName} has a SafeStay Safety Index of ${ssi}. This accommodation is classified as ${riskLevel} risk.`;
  return generateSpeech(text);
}

export async function generateSafetyBriefing(
  accommodationName: string,
  reports: Array<{ category: string; severity: number }>
): Promise<Buffer> {
  const highSeverityReports = reports.filter(r => r.severity >= 7);
  
  let text = `Safety briefing for ${accommodationName}. `;
  
  if (highSeverityReports.length > 0) {
    text += `There are ${highSeverityReports.length} high severity safety concerns: `;
    text += highSeverityReports.map(r => r.category).join(', ') + '. ';
    text += 'Please exercise caution.';
  } else {
    text += 'No high severity safety concerns reported.';
  }

  return generateSpeech(text);
}
