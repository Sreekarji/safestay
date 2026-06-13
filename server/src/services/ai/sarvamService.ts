interface SarvamTranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

const SARVAM_API_URL = 'https://api.sarvam.ai/translate';

// Supported languages map
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ur: 'Urdu',
};

/**
 * Translate text using Sarvam AI translation API.
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<SarvamTranslationResult> {
  const apiKey = process.env.SARVAM_API_KEY || '';

  // Demo mode: return cached or mock translations
  if (process.env.DEMO_MODE === 'true' || !apiKey) {
    console.log(`[DEMO MODE] Sarvam AI translate: "${text}" from ${sourceLanguage} to ${targetLanguage}`);
    await new Promise(r => setTimeout(r, 200));
    return getDemoTranslation(text, sourceLanguage, targetLanguage);
  }

  try {
    const response = await fetch(SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Subscription-Key': apiKey,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: sourceLanguage,
        target_language_code: targetLanguage,
        mode: 'formal',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Sarvam API error:', error.substring(0, 200));
      return getDemoTranslation(text, sourceLanguage, targetLanguage);
    }

    const data = await response.json() as any;

    return {
      translatedText: data.translated_text || text,
      sourceLanguage,
      targetLanguage,
    };
  } catch (error) {
    console.error('Sarvam translation error:', error);
    return getDemoTranslation(text, sourceLanguage, targetLanguage);
  }
}

/**
 * Translate SSI summary for a specific language.
 */
export async function translateSSISummary(
  accommodationName: string,
  ssi: number,
  riskLevel: string,
  targetLanguage: string
): Promise<string> {
  if (targetLanguage === 'en') {
    return `${accommodationName} has a SafeStay Safety Index of ${ssi}. This accommodation is classified as ${riskLevel} risk.`;
  }

  const englishText = `${accommodationName} has a SafeStay Safety Index of ${ssi}. This accommodation is classified as ${riskLevel} risk.`;

  const result = await translateText(englishText, 'en', targetLanguage);
  return result.translatedText;
}

/**
 * Translate safety briefing for a specific language.
 */
export async function translateSafetyBriefing(
  accommodationName: string,
  highSeverityReports: string[],
  targetLanguage: string
): Promise<string> {
  if (targetLanguage === 'en') {
    let text = `Safety briefing for ${accommodationName}. `;
    if (highSeverityReports.length > 0) {
      text += `There are ${highSeverityReports.length} high severity safety concerns: ${highSeverityReports.join(', ')}. Please exercise caution.`;
    } else {
      text += 'No high severity safety concerns reported.';
    }
    return text;
  }

  let englishText = `Safety briefing for ${accommodationName}. `;
  if (highSeverityReports.length > 0) {
    englishText += `There are ${highSeverityReports.length} high severity safety concerns: ${highSeverityReports.join(', ')}. Please exercise caution.`;
  } else {
    englishText += 'No high severity safety concerns reported.';
  }

  const result = await translateText(englishText, 'en', targetLanguage);
  return result.translatedText;
}

/**
 * Demo translation using pre-cached responses or simple mock.
 */
function getDemoTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): SarvamTranslationResult {
  // Try to use pre-cached translations for known keys
  const { PRE_CACHED_SARVAM_TRANSLATIONS } = require('./preCachedResponses');
  const cached = PRE_CACHED_SARVAM_TRANSLATIONS[targetLanguage];

  if (cached) {
    // Find matching cached key
    for (const [key, value] of Object.entries(cached)) {
      if (typeof value === 'string' && value.length > 10) {
        return {
          translatedText: value,
          sourceLanguage,
          targetLanguage,
        };
      }
    }
  }

  // Fallback: return original text with language tag
  return {
    translatedText: `[${targetLanguage.toUpperCase()}] ${text}`,
    sourceLanguage,
    targetLanguage,
  };
}
