# SafeStay — AI-powered Safety Intelligence Network for Student Accommodations

**SafeStay is not a PG listing platform. It is an AI-powered Safety Intelligence Network where verified college students report safety issues about student accommodations (PGs, hostels). Multi-model AI (Mistral Pixtral 12B + Groq Llama 3.3 70B + Gemini Flash) verifies reports. A dynamic SafeStay Safety Index (SSI) (0-100) per accommodation is displayed on an interactive OpenStreetMap.**

## 🎯 Problem Statement

Every year, thousands of Indian students move to new cities for college. They choose PGs and hostels based on fake reviews and broker promises. There is no reliable, AI-verified system for assessing accommodation safety.

## 💡 Solution

SafeStay is an AI-powered Safety Intelligence Network that:
- Accepts safety reports from verified college students
- Uses 3 AI models to verify every report before it affects the Safety Index
- Computes a dynamic SafeStay Safety Index (SSI) for each accommodation
- Displays SSI on an interactive OpenStreetMap with color-coded markers
- Provides multilingual safety intelligence (Telugu + Hindi + English)

## 🏆 Prize Targets

### Main Prize
- **First Prize (₹50K)** — Complete AI-powered Safety Intelligence Network

### Track Prizes (₹5K each)
- **GenAI & ML** — Multi-model AI verification (Mistral + Groq + Gemini), SSI algorithm
- **Cybersecurity** — Fake report detection, verified-only submissions, JWT + bcrypt + rate limiting
- **Sustainable Development** — Student welfare, verified housing safety, social impact
- **Open Innovation** — Scalable Safety Intelligence Network beyond student housing

### Partner Prizes
- **Best Use of MongoDB** — Complex schemas, aggregation pipelines, Atlas collections, SSI computation
- **Best Use of Sarvam AI** — Telugu + Hindi language support
- **Best Use of Gemini** — Gemini Flash context validation in AI pipeline
- **Best Use of Vultr** — Full stack deployment on Vultr
- **Best Use of ElevenLabs** — Voice readout of SSI scores

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + Leaflet/OpenStreetMap + Recharts |
| Backend | Node.js + Express.js + MongoDB Atlas + JWT + bcrypt + Cloudinary + Nodemailer |
| AI Layer | Mistral Pixtral 12B (vision) + Groq Llama 3.3 70B (context) + Gemini Flash (context) |
| Auth | JWT + bcrypt + OTP email verification |
| Storage | Cloudinary for images, MongoDB Atlas for data |
| Deployment | Vultr |

## 📊 Project Structure

```
safestay/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── assets/         # Static assets
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Database, AI config
│   ├── package.json
│   └── tsconfig.json
├── docs/                   # Documentation
│   ├── API.md              # REST API specification
│   ├── ARCHITECTURE.md     # System architecture
│   ├── DATABASE.md         # MongoDB schemas
│   ├── PARTNERS.md         # Partner integrations
│   ├── DEMO.md             # Demo preparation
│   └── RISKS.md            # Risk analysis
├── .gitignore
├── README.md
└── LICENSE
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- API keys: Mistral, Groq, Gemini, Cloudinary, Sarvam AI, ElevenLabs

### Installation

```bash
# Clone repository
git clone https://github.com/Sreekarji/safestay.git
cd safestay

# Install dependencies
cd client && npm install
cd ../server && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development servers
cd client && npm run dev    # Frontend on http://localhost:5173
cd ../server && npm run dev # Backend on http://localhost:5000
```

## 📚 Documentation

- [API Specification](docs/API.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schemas](docs/DATABASE.md)
- [Partner Integrations](docs/PARTNERS.md)
- [Demo Preparation](docs/DEMO.md)
- [Risk Analysis](docs/RISKS.md)

## 👥 Team

- **Person 1** — Backend Lead (MongoDB, API, SSI computation)
- **Person 2** — AI Integration (Mistral + Groq + Gemini + ElevenLabs)
- **Person 3** — Frontend Lead (React, Sarvam AI multilingual)
- **Person 4** — Maps + Dashboard (Leaflet, Vultr deployment)

## 📄 License

This project is licensed under the MIT License.
