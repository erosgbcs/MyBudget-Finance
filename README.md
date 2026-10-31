# MyBudget 📊✨

A modern, iOS-inspired Progressive Web App (PWA) for personal finance tracking, enhanced with AI-powered features. 

MyBudget helps you track expenses, manage multiple accounts, set savings goals, monitor loans with payment progress, and predict your cash flow—all while keeping your data private on your device.

## 🌟 Features

### Core Finance Tracking
- **Accounts Management:** Track balances across GCash, Maribank, Cash, or custom accounts.
- **Transactions:** Log income, expenses, and transfers with automatic budget alerts.
- **Savings Goals:** Set targets and track progress over time.
- **Loans:** Keep track of money you owe or money owed to you, complete with partial payment progress bars.
- **Bills:** Never miss a due date with upcoming bill reminders and overdue indicators.
- **Interactive Charts:** Visualize your income vs. expenses, category spending, and net worth history.
- **PWA & Offline Ready:** Install it on your phone's home screen and use it without an internet connection.

### 🧠 AI Integrations (Powered by Gemini & Groq)
- **Smart Add:** Type a sentence like *"Spent 150 on coffee using GCash"* and the AI automatically fills out the amount, category, and account.
- **Auto-Categorization:** As you type a description, the AI predicts the category instantly.
- **AI Chat Assistant:** Ask questions like *"How much did I spend on food this month?"* or *"What is my net worth?"* based on your real data.
- **Predictive Forecasting:** AI calculates your projected low balance and "safe to spend" amount per day based on upcoming bills and average daily spending.

## 🛠️ Tech Stack
- **Frontend:** HTML5, Vanilla JavaScript, CSS3 (Custom iOS System Design), Chart.js
- **Backend (AI Proxy):** Node.js, Express.js
- **AI Providers:** Google Gemini (Primary), Groq (Fallback)
- **Storage:** Browser `localStorage` (100% private, no database required)

## 🏗️ Architecture
The project is split into two parts:
1. **The PWA (Frontend):** Runs entirely in your browser. Handles UI, math, and local storage.
2. **The AI Proxy (Backend):** A tiny Node.js server that securely holds your API keys and routes requests to Gemini or Groq. (You cannot put API keys in frontend code).

## 🚀 Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A free [Gemini API Key](https://aistudio.google.com/app/apikey)
- A free [Groq API Key](https://console.groq.com/keys)

### 1. Setup the AI Proxy
1. Open your terminal and navigate to the proxy folder:
   ```bash
   cd mybudget-proxy