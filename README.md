# CredIQ – AI-Powered Financial Identity & Fraud Protection

> **Team ARKS · BWT Hackathon 2026 · Future Finance Innovation Platform**

India's first privacy-preserving AI credit platform transforming UPI transaction behavioral patterns into verifiable creditworthiness while providing real-time fraud protection.

---

## 🚀 Quick Start

### Option 1 — Local (Dev Mode)

```bash
# 1. Install dependencies
npm install

# 2. Start Ollama with Qwen2.5-Coder:7B
ollama pull qwen2.5-coder:7b
ollama serve

# 3. Start the app
npm run dev
# → http://localhost:5173
```

**Login:** Any Indian mobile number → OTP: `123456`

---

### Option 2 — Docker (Full Stack)

```bash
# Start everything: Ollama 7B + n8n + CredIQ frontend
docker-compose up -d

# First run: pulls qwen2.5-coder:7b (takes a few minutes)
# Frontend   → http://localhost:3000
# n8n        → http://localhost:5678  (admin / crediq2026)
# Ollama API → http://localhost:11434
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│  React 18 + TypeScript + Vite + Tailwind CSS PWA    │
├─────────────────────────────────────────────────────┤
│  Qwen2.5-Coder:7B (Ollama local) — Zero cloud AI   │
├─────────────────────────────────────────────────────┤
│  n8n Automation Workflows (self-hosted)             │
├─────────────────────────────────────────────────────┤
│  Firebase Auth + Firestore (backend)                │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 1. CredScore Engine
- Analyzes UPI CSV transactions (HDFC, SBI, PhonePe, GPay, Paytm)
- 5 behavioral score components (income, payments, spending, savings, digital)
- 0–850 score range, 5 tiers: Poor → Excellent
- Improvement roadmap with actionable steps
- **100% local AI — zero data sent to cloud**

### 2. ScamShield
- Check any phone number / UPI ID against 20M+ scammer database
- AI-powered risk analysis (Qwen2.5-Coder:7B)
- Scam alert modal with recommended actions
- Community reporting

### 3. Dashboard
- Income/Expense trends (6-month line chart)
- Spending category breakdown (pie chart)
- Real-time transaction feed
- Score component metrics

### 4. Loan Marketplace
- Personalized loan offers based on CredScore
- 4 products: Emergency (₹2K), Microloan (₹50K), Personal (₹2L), Insurance (₹99/mo)
- One-click apply flow

---

## 🤖 AI Model Note

The PRD specifies **Qwen2.5-Coder:14b** but this build uses **Qwen2.5-Coder:7b** (as per team setup).

| Aspect | 14B (PRD) | 7B (This Build) |
|--------|-----------|-----------------|
| RAM needed | 16GB | 8GB |
| Context window | 32K | 8K |
| Accuracy | 92% | ~88% |
| Inference speed | 35–45 tok/s | 50–65 tok/s |
| Batch size | 12 months (300 tx) | 6 months (180 tx) |

The service automatically falls back to smart numerical analysis if Ollama is offline.

---

## 📁 Project Structure

```
src/
├── App.tsx                  # Router
├── pages/
│   ├── LoginPage.tsx        # Phone + OTP auth
│   ├── DashboardPage.tsx    # Main overview
│   ├── CredScorePage.tsx    # Score breakdown
│   ├── ScamShieldPage.tsx   # Fraud protection
│   ├── TransactionsPage.tsx # CSV upload + list
│   └── LoansPage.tsx        # Loan marketplace
├── components/
│   ├── layout/              # Layout, Sidebar, Header
│   └── ui/                  # MetricCard, ScoreGauge, etc.
├── services/
│   ├── ollama.ts            # Qwen2.5-Coder:7b integration
│   ├── firebase.ts          # Auth + Firestore
│   └── upiParser.ts         # CSV parsing + categorization
├── store/
│   └── useAppStore.ts       # Zustand global state
├── utils/
│   ├── helpers.ts           # Formatting, color utilities
│   └── credScore.ts         # Score calculation engine
└── types/
    └── index.ts             # All TypeScript types
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.2 + TypeScript 5.3 + Vite 5.0 |
| Styling | Tailwind CSS 3.4 (custom design system) |
| State | Zustand 4.4 |
| Charts | Recharts 2.10 |
| Animations | Framer Motion 10.16 |
| AI Runtime | Ollama (Qwen2.5-Coder:7b) |
| Automation | n8n 1.19 (self-hosted) |
| Backend | Firebase Auth + Firestore |
| Container | Docker + docker-compose |

---

## 👥 Team ARKS

1. Abhinand Baiju Smitha
2. Karthik R Nair
3. Kenn Viju Mathew
4. Vinatak Arattayil
5. Sunny Singh

**BWT Hackathon 2026 · Future Finance Innovation Platform**
