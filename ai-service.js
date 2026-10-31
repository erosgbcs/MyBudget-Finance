// ai-service.js
const AI_PROXY_URL = 'https://mybudget-proxy-xyz.vercel.app/api/ai';

async function askAI(prompt) {
  const res = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'AI request failed');
  }
  return await res.json(); 
}

// 1. Categorize
async function categorizeTransaction(description) {
  const prompt = `Categorize this transaction into exactly one of these categories: Food, Transport, Shopping, Bills, Entertainment, Health, Other.
Reply with only the category name, nothing else.
Transaction: "${description}"`;
  
  const data = await askAI(prompt);
  const allowed = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];
  const cleaned = data.text.trim().replace(/[^a-zA-Z ]/g, '');
  const match = allowed.find(cat => cat.toLowerCase() === cleaned.toLowerCase());
  return match || 'Other';
}

// 2. Smart Add (Natural Language Parser)
async function parseNaturalLanguage(text, accounts) {
  const accountNames = accounts.map(a => a.name).join(', ');
  const prompt = `Extract transaction details from this text: "${text}"
Available accounts: ${accountNames}.
Reply with ONLY a valid JSON object (no markdown, no backticks) with these exact keys:
{
  "amount": (number),
  "description": (string),
  "category": (string: Food, Transport, Shopping, Bills, Entertainment, Health, Salary, Other Income, Other),
  "type": (string: income, expense),
  "accountName": (string)
}`;
  
  const data = await askAI(prompt);
  try {
    const jsonStr = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Could not parse AI response');
  }
}

// 3. Chat Assistant
async function askBudgetQuestion(question, contextData) {
  const prompt = `You are a helpful budget assistant. Answer the user's question concisely based ONLY on the following financial data. Do not invent numbers.
Note: The "forecast" object contains mathematically calculated predictions for the rest of the month (projectedLowBalance, safeToSpendPerDay).
Data: ${JSON.stringify(contextData)}
Question: ${question}`;
  return await askAI(prompt);
}