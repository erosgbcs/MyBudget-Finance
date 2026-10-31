require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' })); 
app.use(express.json());

// 🚨 PASTE YOUR ACTUAL API KEYS HERE (Keep the single quotes) 🚨
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

// The exact models you requested:
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent'; 
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGemini(prompt) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_KEY,
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(prompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b', 
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

app.post('/api/ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const text = await callGemini(prompt);
    return res.json({ provider: 'gemini', text });
  } catch (geminiErr) {
    console.warn('Gemini failed, falling back to Groq:', geminiErr.message);
  }

  try {
    const text = await callGroq(prompt);
    return res.json({ provider: 'groq', text });
  } catch (groqErr) {
    console.error('Groq also failed:', groqErr.message);
    return res.status(502).json({ error: 'Both AI providers are unavailable.' });
  }
});

// Export the app for Vercel
module.exports = app;

// Only run the listener locally (Vercel handles this automatically in production)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`AI proxy running locally on port ${PORT}`);
  });
}