// ============================================================
// server/utils/elevenLabsService.js
// Text-to-Speech service using ElevenLabs API
// Generates voice readouts for SSI scores
// ============================================================

async function generateSSIVoiceReadout(accommodationName, ssi, topIssues) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      console.warn('[ElevenLabs] API key or Voice ID not configured');
      return null;
    }

    // Build the text to convert to speech
    let issuesText = '';
    if (topIssues && topIssues.length > 0) {
      const issueList = topIssues.slice(0, 3).join(', ');
      issuesText = ` The main safety concerns reported are: ${issueList}.`;
    }

    const ssiDescription = ssi >= 80 ? 'excellent' :
                           ssi >= 60 ? 'good' :
                           ssi >= 40 ? 'moderate' :
                           ssi >= 20 ? 'concerning' : 'critical';

    const text = `The Student Safety Index for ${accommodationName} is ${ssi} out of 100, which is rated as ${ssiDescription}.${issuesText}`;

    console.log(`[ElevenLabs] Generating voice readout for "${accommodationName}" (SSI: ${ssi})`);

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ElevenLabs] API error: ${response.status} - ${errorText.substring(0, 200)}`);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    console.log(`[ElevenLabs] Voice readout generated successfully (${base64Audio.length} chars)`);
    return base64Audio;
  } catch (err) {
    console.error('[ElevenLabs] Error generating voice readout:', err.message);
    return null;
  }
}

module.exports = {
  generateSSIVoiceReadout
};
