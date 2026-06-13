import 'dotenv/config';

async function debugMistral() {
  const key = process.env.MISTRAL_API_KEY;
  console.log('Key present:', !!key, 'Length:', key?.length);
  
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'pixtral-12b-2409',
      messages: [{ role: 'user', content: [
        { type: 'text', text: 'Is this image a fire hazard? Respond with JSON: {"verdict":"accept","confidence":0.9,"reasoning":"..."}' },
        { type: 'image_url', image_url: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Fire_extinguisher_at_the_Canberra_Fire_Museum.jpg/800px-Fire_extinguisher_at_the_Canberra_Fire_Museum.jpg' } }
      ]}],
      max_tokens: 300
    })
  });
  const data = await res.json() as any;
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

debugMistral();
