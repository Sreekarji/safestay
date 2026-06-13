import 'dotenv/config';
import { analyzeWithMistral } from '../services/ai/mistralService';
import { analyzeWithGroq } from '../services/ai/groqService';
import { analyzeWithGemini } from '../services/ai/geminiService';
import { runVerificationPipeline } from '../services/ai/verificationPipeline';
import { generateSSISummary } from '../services/voice/elevenLabsService';

const SAMPLE_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Fire_extinguisher_at_the_Canberra_Fire_Museum.jpg/800px-Fire_extinguisher_at_the_Canberra_Fire_Museum.jpg';
const SAMPLE_REPORT = 'The fire extinguisher on the 2nd floor corridor is expired. The pressure gauge shows empty and the seal is broken. This is a critical fire safety violation.';
const SAMPLE_CATEGORY = 'fire_safety';
const SAMPLE_DESCRIPTION = 'Image shows a red fire extinguisher with visible damage, expired inspection tag, and pressure gauge in the red zone.';

let passed = 0;
let failed = 0;

function printResult(name: string, success: boolean, data: any) {
  if (success) {
    passed++;
    console.log(`✅ PASS | ${name}`);
  } else {
    failed++;
    console.log(`❌ FAIL | ${name}`);
  }
  console.log(`   Response: ${JSON.stringify(data, null, 2).split('\n').join('\n   ')}`);
  console.log('');
}

async function testMistral() {
  console.log('━━━ Testing Mistral Pixtral 12B ━━━');
  try {
    const result = await analyzeWithMistral(SAMPLE_IMAGE, SAMPLE_REPORT, SAMPLE_CATEGORY);
    const success = result.verdict !== undefined && result.confidence > 0;
    printResult('Mistral Vision', success, result);
  } catch (err: any) {
    printResult('Mistral Vision', false, { error: err.message });
  }
}

async function testGroq() {
  console.log('━━━ Testing Groq Llama 3.3 70B ━━━');
  try {
    const result = await analyzeWithGroq(SAMPLE_REPORT, SAMPLE_CATEGORY, SAMPLE_DESCRIPTION);
    const success = result.verdict !== undefined && result.confidence > 0;
    printResult('Groq Context Validation', success, result);
  } catch (err: any) {
    printResult('Groq Context Validation', false, { error: err.message });
  }
}

async function testGemini() {
  console.log('━━━ Testing Gemini Flash ━━━');
  try {
    const result = await analyzeWithGemini(SAMPLE_REPORT, SAMPLE_CATEGORY, SAMPLE_DESCRIPTION);
    const success = result.verdict !== undefined && result.confidence > 0;
    printResult('Gemini Secondary Validation', success, result);
  } catch (err: any) {
    printResult('Gemini Secondary Validation', false, { error: err.message });
  }
}

async function testPipeline() {
  console.log('━━━ Testing Verification Pipeline (all 3 models) ━━━');
  try {
    const result = await runVerificationPipeline(
      'test-report-001',
      SAMPLE_IMAGE,
      SAMPLE_REPORT,
      SAMPLE_CATEGORY,
      SAMPLE_DESCRIPTION
    );
    const success = result.consensus !== undefined && result.overallConfidence > 0;
    printResult('Full Pipeline', success, {
      consensus: result.consensus,
      overallConfidence: result.overallConfidence,
      processingTime: `${result.processingTime}ms`,
      mistral: result.mistral,
      groq: result.groq,
      gemini: result.gemini,
    });
  } catch (err: any) {
    printResult('Full Pipeline', false, { error: err.message });
  }
}

async function testElevenLabs() {
  console.log('━━━ Testing ElevenLabs Voice ━━━');
  try {
    const buffer = await generateSSISummary('Green Valley PG', 85, 'low');
    const success = buffer.length > 0;
    printResult('ElevenLabs TTS', success, {
      audioSize: `${buffer.length} bytes`,
      format: buffer.length > 100 ? 'mp3 (live)' : 'fallback (demo mode)',
    });
  } catch (err: any) {
    printResult('ElevenLabs TTS', false, { error: err.message });
  }
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   SafeStay AI Services — Isolation Test      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  await testMistral();
  await testGroq();
  await testGemini();
  await testPipeline();
  await testElevenLabs();

  console.log('━━━ RESULTS ━━━');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`   Total:  ${passed + failed}`);
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

main();
