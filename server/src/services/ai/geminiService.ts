import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiResponse {
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number;
  reasoning: string;
}

// Get API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function analyzeWithGemini(
  reportText: string,
  category: string,
  imageDescription: string
): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a secondary validator for student accommodation safety reports. Provide a second opinion on the report validity.

Category: ${category}
Image Description: ${imageDescription}
Report: ${reportText}

Analyze:
1. Is the report consistent and plausible?
2. Does the evidence support the claim?
3. Are there any red flags indicating fraud?
4. What is your confidence level?

Respond in JSON format only:
{
  "verdict": "accept" or "reject" or "uncertain",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No response from Gemini');
    }

    const parsed = JSON.parse(content);

    return {
      verdict: parsed.verdict || 'uncertain',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || 'Secondary validation completed'
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return getGeminiFallback(category);
  }
}

function getGeminiFallback(category: string): GeminiResponse {
  return {
    verdict: 'uncertain',
    confidence: 0.5,
    reasoning: `Unable to complete Gemini validation for ${category}. Using fallback.`
  };
}
