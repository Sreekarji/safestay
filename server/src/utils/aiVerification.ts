interface AIVerdict {
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number;
  reasoning: string;
}

interface AIVerificationResult {
  mistral: AIVerdict | null;
  groq: AIVerdict | null;
  gemini: AIVerdict | null;
  consensus: 'accept' | 'reject' | 'pending';
  overallConfidence: number;
}

// Category labels for AI prompts
const CATEGORY_LABELS: Record<string, string> = {
  fire_safety: 'Fire Safety',
  water_quality: 'Water Quality',
  structural: 'Structural Safety',
  electrical: 'Electrical Safety',
  hygiene: 'Hygiene',
  security: 'Security',
  food_safety: 'Food Safety',
  other: 'Other Safety Issue',
};

/**
 * Mistral Pixtral 12B - Vision model for image analysis
 * Analyzes uploaded images for relevance to the complaint type
 */
const verifyWithMistral = async (
  images: string[],
  category: string,
  title: string,
  description: string
): Promise<AIVerdict> => {
  const startTime = Date.now();

  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error('MISTRAL_API_KEY not configured');

    const categoryLabel = CATEGORY_LABELS[category] || category;

    // Build prompt for vision analysis
    const prompt = `You are a safety inspection AI. Analyze this image for a ${categoryLabel} complaint.

Complaint Title: ${title}
Complaint Description: ${description}

Determine if the image:
1. Shows evidence relevant to the reported ${categoryLabel} issue
2. Is authentic and not manipulated
3. Supports or contradicts the complaint

Respond in JSON format:
{
  "verdict": "accept" | "reject" | "uncertain",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    // Call Mistral API with image
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'pixtral-large-latest',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...images.map(img => ({
                type: 'image_url',
                image_url: { url: img },
              })),
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        verdict: result.verdict || 'uncertain',
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        reasoning: result.reasoning || 'Analysis complete',
      };
    }

    return {
      verdict: 'uncertain',
      confidence: 0.5,
      reasoning: 'Unable to parse AI response',
    };
  } catch (error) {
    console.error('Mistral verification error:', error);
    return {
      verdict: 'uncertain',
      confidence: 0.3,
      reasoning: `Mistral analysis failed: ${error}`,
    };
  }
};

/**
 * Groq Llama 3.3 70B - Context model for complaint validation
 * Validates complaint legitimacy and produces final verdict
 */
const verifyWithGroq = async (
  category: string,
  title: string,
  description: string,
  severity: number
): Promise<AIVerdict> => {
  const startTime = Date.now();

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const categoryLabel = CATEGORY_LABELS[category] || category;

    const prompt = `You are a safety compliance expert analyzing a student accommodation safety complaint.

COMPLAINT DETAILS:
- Category: ${categoryLabel}
- Title: ${title}
- Description: ${description}
- Reported Severity: ${severity}/10

Analyze this complaint for:
1. Credibility: Is the complaint specific and detailed?
2. Consistency: Does the description match the severity level?
3. Legitimacy: Does this sound like a genuine safety concern?
4. Urgency: How urgent is this issue?

Respond in JSON format:
{
  "verdict": "accept" | "reject" | "uncertain",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a safety compliance expert. Always respond in valid JSON format.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        verdict: result.verdict || 'uncertain',
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        reasoning: result.reasoning || 'Analysis complete',
      };
    }

    return {
      verdict: 'uncertain',
      confidence: 0.5,
      reasoning: 'Unable to parse AI response',
    };
  } catch (error) {
    console.error('Groq verification error:', error);
    return {
      verdict: 'uncertain',
      confidence: 0.3,
      reasoning: `Groq analysis failed: ${error}`,
    };
  }
};

/**
 * Gemini Flash - Secondary context validation
 * Provides additional validation alongside Groq
 */
const verifyWithGemini = async (
  category: string,
  title: string,
  description: string,
  severity: number
): Promise<AIVerdict> => {
  const startTime = Date.now();

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const categoryLabel = CATEGORY_LABELS[category] || category;

    const prompt = `Analyze this student accommodation safety complaint for legitimacy:

Category: ${categoryLabel}
Title: ${title}
Description: ${description}
Severity: ${severity}/10

Evaluate:
1. Is this a valid safety concern?
2. Is the complaint specific enough to act on?
3. Does severity match the described issue?

Respond ONLY in JSON:
{
  "verdict": "accept" | "reject" | "uncertain",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        verdict: result.verdict || 'uncertain',
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        reasoning: result.reasoning || 'Analysis complete',
      };
    }

    return {
      verdict: 'uncertain',
      confidence: 0.5,
      reasoning: 'Unable to parse AI response',
    };
  } catch (error) {
    console.error('Gemini verification error:', error);
    return {
      verdict: 'uncertain',
      confidence: 0.3,
      reasoning: `Gemini analysis failed: ${error}`,
    };
  }
};

/**
 * Calculate consensus from all model verdicts
 */
const calculateConsensus = (
  mistral: AIVerdict | null,
  groq: AIVerdict | null,
  gemini: AIVerdict | null
): { consensus: 'accept' | 'reject' | 'pending'; confidence: number } => {
  const verdicts = [mistral, groq, gemini].filter(Boolean);

  if (verdicts.length === 0) {
    return { consensus: 'pending', confidence: 0 };
  }

  // Count verdicts
  const acceptCount = verdicts.filter(v => v!.verdict === 'accept').length;
  const rejectCount = verdicts.filter(v => v!.verdict === 'reject').length;
  const totalVerdicts = verdicts.length;

  // Calculate weighted confidence (higher weight for vision model)
  const weights = { mistral: 0.4, groq: 0.35, gemini: 0.25 };
  let weightedConfidence = 0;

  if (mistral) weightedConfidence += mistral.confidence * weights.mistral;
  if (groq) weightedConfidence += groq.confidence * weights.groq;
  if (gemini) weightedConfidence += gemini.confidence * weights.gemini;

  // Consensus logic
  if (acceptCount >= 2 || (acceptCount === 1 && totalVerdicts === 1)) {
    return { consensus: 'accept', confidence: weightedConfidence };
  }

  if (rejectCount >= 2 || (rejectCount === 1 && totalVerdicts === 1)) {
    return { consensus: 'reject', confidence: weightedConfidence };
  }

  // Mixed results - check if confidence is high enough
  if (weightedConfidence >= 0.7) {
    return {
      consensus: acceptCount > rejectCount ? 'accept' : 'reject',
      confidence: weightedConfidence,
    };
  }

  return { consensus: 'pending', confidence: weightedConfidence };
};

/**
 * Main verification function - runs all 3 models in parallel
 */
export const verifyReport = async (
  reportId: string,
  images: string[],
  category: string,
  title: string,
  description: string,
  severity: number
): Promise<AIVerificationResult> => {
  console.log(`🤖 Starting AI verification for report ${reportId}`);

  // Run all models in parallel using Promise.allSettled
  const [mistralResult, groqResult, geminiResult] = await Promise.allSettled([
    verifyWithMistral(images, category, title, description),
    verifyWithGroq(category, title, description, severity),
    verifyWithGemini(category, title, description, severity),
  ]);

  const mistral = mistralResult.status === 'fulfilled' ? mistralResult.value : null;
  const groq = groqResult.status === 'fulfilled' ? groqResult.value : null;
  const gemini = geminiResult.status === 'fulfilled' ? geminiResult.value : null;

  // Calculate consensus
  const { consensus, confidence } = calculateConsensus(mistral, groq, gemini);

  console.log(`✅ AI verification complete for report ${reportId}:`);
  console.log(`   Mistral: ${mistral?.verdict} (${mistral?.confidence})`);
  console.log(`   Groq: ${groq?.verdict} (${groq?.confidence})`);
  console.log(`   Gemini: ${gemini?.verdict} (${gemini?.confidence})`);
  console.log(`   Consensus: ${consensus} (${confidence})`);

  return {
    mistral,
    groq,
    gemini,
    consensus,
    overallConfidence: Math.round(confidence * 100) / 100,
  };
};

/**
 * Get AI status for health check
 */
export const getAIStatus = async () => {
  const mistralKey = !!process.env.MISTRAL_API_KEY;
  const groqKey = !!process.env.GROQ_API_KEY;
  const geminiKey = !!process.env.GEMINI_API_KEY;

  return {
    mistral: { status: mistralKey ? 'online' : 'offline', model: 'Pixtral 12B' },
    groq: { status: groqKey ? 'online' : 'offline', model: 'Llama 3.3 70B' },
    gemini: { status: geminiKey ? 'online' : 'offline', model: 'Flash' },
    pipeline: mistralKey && groqKey ? 'operational' : 'degraded',
  };
};
