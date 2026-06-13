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

/**
 * Generate speech audio from text using ElevenLabs API.
 * Uses Node 18+ built-in fetch (no external dependency needed).
 */
export async function generateSpeech(text: string): Promise<Buffer> {
  // DEMO_MODE: return fallback audio instantly
  if (process.env.DEMO_MODE === 'true') {
    await new Promise(r => setTimeout(r, 300));
    console.log(`[DEMO MODE] ElevenLabs fallback — would speak: "${text}"`);
    return generateFallbackAudio(text);
  }

  const { apiKey, voiceId, modelId } = ELEVENLABS_CONFIG;

  if (!apiKey) {
    console.warn('ElevenLabs API key not configured, using fallback');
    return generateFallbackAudio(text);
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

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('ElevenLabs synthesis error, using fallback:', error);
    return generateFallbackAudio(text);
  }
}

/**
 * Generate fallback audio placeholder (valid minimal MP3 header).
 * Frontend should display text instead of playing this.
 */
function generateFallbackAudio(text: string): Buffer {
  console.log(`[FALLBACK] ElevenLabs — would speak: "${text}"`);
  // Return a tiny valid buffer (ID3v2 header)
  return Buffer.from([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
}

/**
 * Generate SSI summary audio.
 */
export async function generateSSISummary(
  accommodationName: string,
  ssi: number,
  riskLevel: string
): Promise<Buffer> {
  const text = `${accommodationName} has a SafeStay Safety Index of ${ssi}. This accommodation is classified as ${riskLevel} risk.`;
  return generateSpeech(text);
}

/**
 * Generate safety briefing audio.
 */
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
