import fetch from 'node-fetch';

interface GroqResponse {
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number;
  reasoning: string;
}

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function analyzeWithGroq(
  reportText: string,
  category: string,
  imageDescription: string
): Promise<GroqResponse> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a context validator for student accommodation safety reports. Analyze the report for consistency, plausibility, and potential fraud indicators.

Category: ${category}
Image Description: ${imageDescription}

Check for:
1. Does the description match the image?
2. Is the severity level reasonable?
3. Are there signs of fake or exaggerated claims?
4. Is this a common safety issue for this category?

Respond in JSON format:
{
  "verdict": "accept" or "reject" or "uncertain",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation"
}`
          },
          {
            role: 'user',
            content: reportText
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Groq');
    }

    const parsed = JSON.parse(content);

    return {
      verdict: parsed.verdict || 'uncertain',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || 'Context validation completed'
    };
  } catch (error) {
    console.error('Groq API error:', error);
    return getGroqFallback(category);
  }
}

function getGroqFallback(category: string): GroqResponse {
  return {
    verdict: 'uncertain',
    confidence: 0.5,
    reasoning: `Unable to complete Groq context validation for ${category}. Using fallback.`
  };
}
