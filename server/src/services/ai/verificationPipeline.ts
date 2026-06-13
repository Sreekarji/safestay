import { analyzeWithMistral } from './mistralService';
import { analyzeWithGroq } from './groqService';
import { analyzeWithGemini } from './geminiService';

export interface VerificationResult {
  mistral: {
    verdict: 'accept' | 'reject' | 'uncertain';
    confidence: number;
    reasoning: string;
  };
  groq: {
    verdict: 'accept' | 'reject' | 'uncertain';
    confidence: number;
    reasoning: string;
  };
  gemini: {
    verdict: 'accept' | 'reject' | 'uncertain';
    confidence: number;
    reasoning: string;
  };
  consensus: 'accept' | 'reject' | 'pending';
  overallConfidence: number;
  processingTime: number;
}

export async function runVerificationPipeline(
  reportId: string,
  imageUrl: string,
  reportText: string,
  category: string,
  imageDescription: string
): Promise<VerificationResult> {
  const startTime = Date.now();

  try {
    // Run all three models in parallel — Promise.allSettled ensures one failure doesn't kill others
    const [mistralSettled, groqSettled, geminiSettled] = await Promise.allSettled([
      analyzeWithMistral(imageUrl, reportText, category),
      analyzeWithGroq(reportText, category, imageDescription),
      analyzeWithGemini(reportText, category, imageDescription)
    ]);

    const fallback = { verdict: 'uncertain' as const, confidence: 0.5, reasoning: 'Model unavailable — using fallback' };

    const mistralResult = mistralSettled.status === 'fulfilled' ? mistralSettled.value : fallback;
    const groqResult = groqSettled.status === 'fulfilled' ? groqSettled.value : fallback;
    const geminiResult = geminiSettled.status === 'fulfilled' ? geminiSettled.value : fallback;

    if (mistralSettled.status === 'rejected') console.error('Mistral failed:', mistralSettled.reason);
    if (groqSettled.status === 'rejected') console.error('Groq failed:', groqSettled.reason);
    if (geminiSettled.status === 'rejected') console.error('Gemini failed:', geminiSettled.reason);

    // Calculate consensus
    const consensus = calculateConsensus(mistralResult.verdict, groqResult.verdict, geminiResult.verdict);
    
    // Calculate overall confidence (weighted average)
    const overallConfidence = calculateOverallConfidence(
      mistralResult.confidence,
      groqResult.confidence,
      geminiResult.confidence
    );

    const processingTime = Date.now() - startTime;

    return {
      mistral: mistralResult,
      groq: groqResult,
      gemini: geminiResult,
      consensus,
      overallConfidence,
      processingTime
    };
  } catch (error) {
    console.error('Verification pipeline error:', error);
    return getFallbackResult(startTime);
  }
}

function calculateConsensus(
  mistralVerdict: string,
  groqVerdict: string,
  geminiVerdict: string
): 'accept' | 'reject' | 'pending' {
  const verdicts = [mistralVerdict, groqVerdict, geminiVerdict];
  
  // Count each verdict type
  const acceptCount = verdicts.filter(v => v === 'accept').length;
  const rejectCount = verdicts.filter(v => v === 'reject').length;
  const uncertainCount = verdicts.filter(v => v === 'uncertain').length;

  // Majority wins (2 out of 3)
  if (acceptCount >= 2) return 'accept';
  if (rejectCount >= 2) return 'reject';
  
  // If all uncertain or mixed, return pending for admin review
  return 'pending';
}

function calculateOverallConfidence(
  mistralConfidence: number,
  groqConfidence: number,
  geminiConfidence: number
): number {
  // Weighted average: Mistral (vision) gets higher weight for image-heavy reports
  const weights = {
    mistral: 0.4,  // Vision model - best for image analysis
    groq: 0.35,    // Context validation
    gemini: 0.25   // Secondary validation
  };

  const weightedSum = 
    (mistralConfidence * weights.mistral) +
    (groqConfidence * weights.groq) +
    (geminiConfidence * weights.gemini);

  return Math.min(1, Math.max(0, weightedSum));
}

function getFallbackResult(startTime: number): VerificationResult {
  return {
    mistral: {
      verdict: 'uncertain',
      confidence: 0.5,
      reasoning: 'Mistral analysis unavailable - using fallback'
    },
    groq: {
      verdict: 'uncertain',
      confidence: 0.5,
      reasoning: 'Groq analysis unavailable - using fallback'
    },
    gemini: {
      verdict: 'uncertain',
      confidence: 0.5,
      reasoning: 'Gemini analysis unavailable - using fallback'
    },
    consensus: 'pending',
    overallConfidence: 0.5,
    processingTime: Date.now() - startTime
  };
}
