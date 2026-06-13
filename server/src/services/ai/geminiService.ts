import { PRE_CACHED_AI_RESPONSES } from './preCachedResponses';

interface GeminiResponse {
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number;
  reasoning: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function analyzeWithGemini(reportText: string, category: string, imageDescription: string): Promise<GeminiResponse> {
  if (process.env.DEMO_MODE === 'true') {
    await new Promise(r => setTimeout(r, 300));
    const cached = PRE_CACHED_AI_RESPONSES.fire_safety?.broken_extinguisher?.gemini;
    if (cached) { console.log('[DEMO MODE] Returning cached Gemini response'); return { verdict: cached.verdict, confidence: cached.confidence, reasoning: cached.reasoning }; }
  }
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = 'You are a secondary validator for safety reports. Category: ' + category + '. Description: ' + imageDescription + '. Report: ' + reportText + '. Respond in JSON: {"verdict":"accept"|"reject"|"uncertain","confidence":0.0-1.0,"reasoning":"..."}';
    const result = await model.generateContent(prompt);
    const content = result.response.text();
    if (!content) throw new Error('No response from Gemini');
    const parsed = JSON.parse(content);
    return { verdict: parsed.verdict || 'uncertain', confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)), reasoning: parsed.reasoning || 'Secondary validation completed' };
  } catch (error) { console.error('Gemini API error:', error); return getGeminiFallback(category); }
}

function getGeminiFallback(category: string): GeminiResponse {
  return { verdict: 'uncertain', confidence: 0.5, reasoning: 'Unable to complete Gemini validation for ' + category + '. Using fallback.' };
}
