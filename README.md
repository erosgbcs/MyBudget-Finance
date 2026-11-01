# MyBudget 📊✨

A modern, iOS-inspired Progressive Web App (PWA) for personal finance tracking, enhanced with AI-powered features. 

MyBudget helps you track expenses, manage multiple accounts, set savings goals, monitor loans with payment progress, and predict your cash flow—all while keeping your data private on your device.

## 🌟 Features

### Core Finance Tracking
- **Accounts & Transactions Management:** Track balances across GCash, Maribank, Cash, or custom accounts. Easily edit accounts and transactions with a native-feeling swipe gesture (Swipe left to Edit/Delete).
- **Recurring Transactions:** Set up repeat monthly transactions. View, manage, and cancel active subscriptions directly from the Settings tab.
- **Smart Bills:** Never miss a due date. Marking a bill as "Paid" automatically logs the expense and deducts it from your default account.
- **Savings & Loans:** Set targets for savings goals, track progress over time, and monitor money you owe or are owed with partial payment progress bars.
- **Interactive Charts:** Visualize your income vs. expenses, category spending, and net worth history.
- **PWA & Offline Ready:** Install it on your phone's home screen and use it without an internet connection.

### 🧠 AI Integrations (Powered by Gemini & Groq)
- **Smart Add:** Type a sentence like *"Spent 150 on coffee using GCash"* and the AI automatically fills out the amount, category, and account.
- **Dynamic Category Creation:** The AI isn't restricted to your current list. If you buy groceries and don't have a "Groceries" category, it will invent one, format it correctly, and save it to your database automatically.
- **Bulk AI Cleanup:** A dedicated tool in Settings that scans all uncategorized ("Other") transactions and automatically categorizes them in bulk.
- **Proactive Anomaly Detection:** On app load, the AI checks your recent spending. If you spent 40% more this week than your monthly average, it shows a warning banner to keep you on track.
- **AI Financial Digest:** Generate a personalized, motivating monthly summary highlighting your biggest expenses, savings rate, and actionable tips.
- **Interactive AI Chat Assistant:** Ask questions like *"How much did I spend on food this month?"* or add transactions via chat (e.g., *"Add 500 for gas"*). 
- **Predictive Forecasting:** AI calculates your projected low balance and "safe to spend" amount per day based on upcoming bills and average daily spending.

### 📱 Native App Feel & Security
- **Biometric/Passcode Lock:** Secure your app with a 4-digit PIN.
- **Inactivity Auto-Lock:** Automatically locks the app after 2 minutes of inactivity to keep your finances hidden if you leave your phone unattended.
- **Haptic Feedback:** Subtle vibrations on button taps and swipes make the PWA feel like a native application.
- **PWA Install Prompt:** Smart detection for iOS and Android to prompt users to add the app to their Home Screen.
- **Dynamic iOS Design System:** True dark mode, customizable color palettes, and a responsive UI built on Apple's Human Interface Guidelines.

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
