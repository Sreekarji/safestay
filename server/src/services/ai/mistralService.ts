import fetch from 'node-fetch';
import { PRE_CACHED_AI_RESPONSES } from './preCachedResponses.js';

interface MistralResponse {
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number;
  reasoning: string;
}

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function analyzeWithMistral(
  imageUrl: string,
  reportText: string,
  category: string
): Promise<MistralResponse> {
  // DEMO_MODE: return cached response instantly
  if (process.env.DEMO_MODE === 'true') {
    await new Promise(r => setTimeout(r, 300));
    const cached = PRE_CACHED_AI_RESPONSES.fire_safety?.broken_extinguisher?.mistral;
    if (cached) {
      console.log('[DEMO MODE] Returning cached Mistral response');
      return { verdict: cached.verdict, confidence: cached.confidence, reasoning: cached.reasoning };
    }
  }

  const startTime = Date.now();

  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [
          {
            role: 'system',
            content: `You are a safety report verifier for student accommodations. Analyze the image and report text to determine if this is a legitimate safety concern.

Category: ${category}

Respond in JSON format:
{
  "verdict": "accept" or "reject" or "uncertain",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Report: ${reportText}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json() as any;
    
    // Debug: log raw response
    if (data.object === 'error' || !data.choices) {
    console.error('Mistral raw error:', JSON.stringify(data));
    throw new Error(data.message || 'No response from Mistral');
    }

    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Mistral');
    }

    const parsed = JSON.parse(content);
    const processingTime = Date.now() - startTime;

    return {
      verdict: parsed.verdict || 'uncertain',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || 'Analysis completed'
    };
  } catch (error) {
    console.error('Mistral API error:', error);
    return getMistralFallback(category);
  }
}

function getMistralFallback(category: string): MistralResponse {
  return {
    verdict: 'uncertain',
    confidence: 0.5,
    reasoning: `Unable to complete Mistral analysis for ${category}. Using fallback.`
  };
}
