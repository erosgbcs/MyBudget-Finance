  // ai-service.js
  const AI_PROXY_URL = 'https://mybudget-lilac.vercel.app/api/ai';

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
  async function categorizeTransaction(description, validCategories) {
    const allowed = validCategories || ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Other Income', 'Other'];
    const prompt = `Categorize this transaction. 
  Prefer using one of these existing categories if it fits perfectly: ${allowed.join(', ')}.
  If none fit, create a short, standard 1-2 word category name (Title Case, e.g., "Groceries", "Subscriptions", "Pets").
  Reply with ONLY the category name, nothing else.
  Transaction: "${description}"`;
    
    const data = await askAI(prompt);
    const cleaned = data.text.trim().replace(/[^a-zA-Z ]/g, '');
    
    // Try to match existing categories first
    const match = allowed.find(cat => cat.toLowerCase() === cleaned.toLowerCase());
    if (match) return match;
    
    // If it doesn't match, capitalize the new category and return it
    return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || 'Other';
  }

  // 2. Smart Add (Natural Language Parser)
  async function parseReceiptImage(base64Image) {
    const prompt = `Extract transaction details from this receipt image. 
  Reply with ONLY a valid JSON object (no markdown, no backticks) with these exact keys:
  {
    "amount": (number),
    "description": (string - the merchant name),
    "category": (string: Food, Transport, Shopping, Bills, Entertainment, Health, Salary, Other Income, Other),
    "type": "expense"
  }`;
    
    const res = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, image: base64Image }),
    });
    
    if (!res.ok) throw new Error('Receipt scan failed');
    const data = await res.json();
    try {
      const jsonStr = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      throw new Error('Could not parse AI response');
    }
  }

  async function parseNaturalLanguage(text, accounts, validCategories) {
    const accountNames = accounts.map(a => a.name).join(', ');
    const allowed = validCategories || ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Other Income', 'Other'];
    const prompt = `Extract transaction details from this text: "${text}"
  Available accounts: ${accountNames}.
  Reply with ONLY a valid JSON object (no markdown, no backticks) with these exact keys:
  {
    "amount": (number),
    "description": (string),
    "category": (string: Prefer one of these: ${allowed.join(', ')}. If none fit perfectly, create a short 1-2 word Title Case category),
    "type": (string: income, expense),
    "accountName": (string)
  }`;
    
    const data = await askAI(prompt);
    try {
      const jsonStr = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      
      // Ensure the category is Title Case if it's a new one
      if (parsed.category) {
          parsed.category = parsed.category.trim().split(' ')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
      return parsed;
    } catch (e) {
      throw new Error('Could not parse AI response');
    }
  }

  // 3. Chat Assistant
  async function askBudgetQuestion(question, contextData) {
    const prompt = `You are a helpful, premium financial assistant. Answer the user's question based ONLY on the following financial data. Do not invent numbers.
  Note: The "forecast" object contains mathematically calculated predictions for the rest of the month (projectedLowBalance, safeToSpendPerDay).

  FORMATTING RULES:
  1. ALWAYS use the Philippine Peso symbol (₱) for all currency amounts (e.g., ₱1,500.00). Never use $ or USD.
  2. Use **bold** for key numbers and categories.
  3. Wrap positive financial amounts (income, savings, surplus) in [green]...[/green] tags.
  4. Wrap negative financial amounts (expenses, debt, deficits) in [red]...[/red] tags.
  5. Use emojis sparingly (e.g., 🟢, 🔴, 📊, 💡).
  6. Use line breaks (\n) to separate thoughts.
  7. Keep it concise and conversational. Do not use markdown bullet points (-).

  Data: ${JSON.stringify(contextData)}
  Question: ${question}`;
    return await askAI(prompt);
  }