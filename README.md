# 🌉 FoodBridge AI

> **AI-powered food rescue platform** connecting restaurants with NGOs and volunteers to reduce food waste using Multi-Agent AI, RAG, Gemini Vision, and real-time mapping.

[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://foodbridge-frontend.onrender.com)
[![Backend](https://img.shields.io/badge/Backend-API-blue)](https://foodbridge-backend.onrender.com)

---

## 🚀 Features

| Feature | Technology |
|---------|-----------|
| 🔍 **AI Food Inspector** | Gemini Vision AI — scan food photo → auto-fill form |
| ⏱️ **Spoilage Predictor** | RAG + FSSAI regulations + ML heuristics |
| 🤝 **Smart NGO Matchmaker** | Multi-Agent AI with capacity & distance scoring |
| 📊 **Surplus Forecasting** | ML regression model for restaurants |
| 🌿 **Green Routing** | CO₂ savings calculator with Leaflet live maps |
| 💬 **BridgeBot** | RAG chatbot with FSSAI regulatory citations |
| 🗺️ **Live Map** | Leaflet + OpenStreetMap with real-time markers |
| 🔔 **Role-Based Auth** | Restaurant / NGO / Volunteer dashboards |

---

## 🏗️ Tech Stack

**Frontend:** React 19 + Vite, Leaflet/OpenStreetMap, CSS3  
**Backend:** Node.js + Express.js  
**Database:** Supabase (PostgreSQL + pgvector + PostGIS + Realtime)  
**AI:** Google Gemini 1.5 Flash, RAG with FSSAI knowledge base  
**Deployment:** Render (backend web service + frontend static site)

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- A Supabase project
- A Google Gemini API key

### 1. Clone & Install
```bash
git clone https://github.com/jyoeetaJoy/foodbridge-ai.git
cd foodbridge-ai

# Install frontend deps
npm install

# Install backend deps
cd backend && npm install
```

### 2. Configure Environment
```bash
# In /backend folder:
cp .env.example .env
# Edit .env with your keys
```

### 3. Set Up Supabase Schema
1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copy and run `backend/supabase_schema.sql`

### 4. Start Development
```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000

---

## 🌐 Deploy to Render

### Backend (Web Service)
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Environment Variables:** (see `.env.example`)

### Frontend (Static Site)
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL` = your backend Render URL
- **Rewrite Rule:** `/*` → `/index.html`

---

## 🧠 AI Architecture

```
User Action
    │
    ▼
Agent Orchestrator (agentOrchestrator.js)
    ├── 🔍 Food Inspector Agent    → Gemini Vision API
    ├── ⚠️  Spoilage Agent         → RAG + FSSAI Knowledge Base
    ├── 🤝 Matchmaker Agent       → Scoring + Supabase NGO data
    ├── 📊 Forecasting Agent      → ML Regression
    └── 🌿 Green Logistics Agent  → CO₂ calculations
         │
         ▼
    RAG Engine (ragService.js)
         ├── BM25 TF-IDF keyword search
         ├── Cosine similarity vector search
         └── FSSAI 2019 Regulatory Knowledge Base (8 chunks)
```

---

## 📁 Project Structure

```
foodbridge-ai/
├── src/                        # React frontend
│   ├── components/
│   │   └── BridgeBot.jsx       # AI chat widget
│   ├── pages/
│   │   ├── restaurant/         # Restaurant dashboard, CreateDonation
│   │   ├── ngo/               # Available food, requests
│   │   └── volunteer/         # Pickups, live map
│   └── config/api.js          # API base URL config
├── backend/
│   ├── config/
│   │   ├── gemini.js          # Gemini AI client
│   │   └── supabase.js        # Supabase client + fallback
│   ├── data/knowledge_base/
│   │   └── fssai_regulations.json  # RAG knowledge base
│   ├── routes/
│   │   ├── aiRoutes.js        # All AI endpoints
│   │   └── donationRoutes.js  # Donation CRUD
│   ├── services/
│   │   ├── ragService.js      # RAG retrieval engine
│   │   └── agentOrchestrator.js  # Multi-agent AI
│   ├── supabase_schema.sql    # DB schema (run in Supabase)
│   └── server.js              # Express entry point
├── render.yaml                 # Render deployment config
└── index.html                  # Leaflet CDN links
```

---

## 📜 License
MIT — built for college minor project submission.
