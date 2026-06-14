# SafeStay — AI-Powered Safety Intelligence Network for Student Accommodations

SafeStay is an AI-powered Safety Intelligence Network where verified college students report safety issues about student accommodations (PGs, hostels). A multi-model AI pipeline (Mistral Pixtral 12B + Groq Llama 3.3 70B + Gemini Flash) verifies every report. A dynamic SafeStay Safety Index (SSI) score (0–100) is computed per accommodation and displayed on an interactive OpenStreetMap with route intelligence, timeline history, and voice readout.

## Features

### Core
- **AI-Verified Reports** — 3-model consensus (Mistral Vision + Groq Context + Gemini Flash). 2-of-3 must agree for VERIFIED verdict.
- **SafeStay Safety Index (SSI)** — Dynamic 0–100 score per accommodation based on verified reports, severity, resolution speed, and community feedback.
- **Interactive Safety Map** — Leaflet/OpenStreetMap with color-coded markers (green/yellow/red), location search, radius filtering.
- **Route Intelligence** — Select accommodation + college, see colored polyline route with safety segments, risk hotspots, travel time, night safety rating.
- **Timeline Slider** — Scrub through 12 months of historical SSI data. Markers update colors per selected month.
- **Voice Readout** — ElevenLabs TTS generates audio safety summaries for any accommodation.
- **Multilingual** — English, Hindi (हिन्दी), Telugu (తెలుగు) via react-i18next with language toggle.

### Platform
- **Student Portal** — Register with college email, submit evidence-based reports with image upload, track report lifecycle.
- **Owner Portal** — Register property with documents, respond to reports with resolution proof, track trust score.
- **Admin Dashboard** — Moderation panel with AI analytics, report management, owner verification, Recharts visualizations (SSI trend, category breakdown, area risk).
- **College Verification** — 250+ Indian college domains auto-verified on signup.
- **Report Lifecycle** — pending → approved → resolved → verified/disputed with full audit trail.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 4, Zustand, shadcn/ui, framer-motion, Leaflet, Recharts, react-i18next |
| Backend | Node.js, Express.js (TypeScript via tsx), MongoDB Atlas, JWT, bcrypt, Cloudinary, Nodemailer |
| AI | Mistral Pixtral 12B (vision), Groq Llama 3.3 70B (context), Gemini 1.5 Flash (context) |
| Voice | ElevenLabs TTS |
| Auth | JWT + bcrypt + OTP email verification |
| Storage | Cloudinary (images), MongoDB Atlas (data) |
| Maps | Leaflet + OpenStreetMap + CARTO tiles |

## Project Structure

```
safestay/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                # LoginForm, RegisterForm, OwnerRegisterForm, OTPVerification
│   │   │   ├── common/              # ErrorBoundary, ImageUpload, ImageGallery, TrustScoreBadge, UpvoteButton, VerifiedBadge, VoicePlayer, LocationPicker, LanguageToggle
│   │   │   ├── dashboard/           # AnalyticsDashboard, StatsGrid, RiskChart, CategoryBreakdown, RecentActivity
│   │   │   ├── layout/              # Layout, Navbar, Footer
│   │   │   ├── map/                 # SafetyMap, LeafletMap, RoutePlanner, RouteOverlay, RouteSafetyPanel, RouteComparison, SearchBar, FilterBar, TimelineSlider, SafetyTimelinePanel, MarkerPopup, SSILegend, ThemeToggle
│   │   │   ├── reports/             # ReportForm, ReportCard, ReportFilters, AIVerdict, VoicePlayer
│   │   │   └── ui/                  # shadcn/ui primitives (button, card, badge, input, dialog, tabs, etc.)
│   │   ├── contexts/                # ThemeContext, MapContext
│   │   ├── hooks/                   # useAuth, useLanguage
│   │   ├── i18n/                    # i18next config + locales (en.json, hi.json, te.json)
│   │   ├── lib/                     # utils (cn, formatDate, getSSI*), constants, validations (zod schemas)
│   │   ├── pages/                   # 20 pages (see below)
│   │   ├── services/                # api, authService, reportService, accommodationService, mapService, mapData, routeData
│   │   ├── stores/                  # Zustand: authStore, reportStore, languageStore
│   │   └── types/                   # TypeScript type definitions
│   └── vite.config.js
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── config/                  # db (MongoDB), cloudinary
│   │   ├── controllers/             # aiController
│   │   ├── middleware/              # authMiddleware, adminMiddleware, ownerMiddleware, rateLimiter
│   │   ├── models/                  # User, Report, Accommodation, OTP, VerificationResult
│   │   ├── routes/                  # auth, reports, accommodations, admin, owner, analytics, aiRoutes, upload, otp
│   │   ├── services/
│   │   │   ├── ai/                  # mistralService, groqService, geminiService, verificationPipeline, preCachedResponses
│   │   │   └── voice/               # elevenLabsService
│   │   ├── utils/                   # collegeVerification, emailService, emailTemplates, trustScore
│   │   └── scripts/                 # seed, debugMistral, testServices
│   └── tsconfig.json
├── docs/                            # API.md, ARCHITECTURE.md, DATABASE.md, PARTNERS.md, DEMO.md, RISKS.md
├── start.bat                        # One-click start (backend + frontend)
└── README.md
```

## Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Landing | `/` | Public | Hero, features, stats, CTA |
| Login | `/login` | Public | Student login |
| Register | `/register` | Public | Student registration with college verification |
| Owner Login | `/owner/login` | Public | Property owner login |
| Owner Register | `/owner/register` | Public | Owner registration with document upload |
| Forgot Password | `/forgot-password` | Public | OTP-based password reset |
| Verify OTP | `/verify-otp` | Public | Email OTP verification |
| Verify Email | `/verify-email` | Public | Email verification |
| Dashboard | `/dashboard` | Student | Personal dashboard with stats and recent activity |
| Report Submit | `/report/new` | Student | Multi-step report form with image upload |
| Report Incident | `/report-incident` | Student | Advanced report form with AI verification |
| My Reports | `/my-reports` | Student | All submitted reports with status tracking |
| Report Detail | `/report/:id` | Student | Single report view with resolution tracking |
| Profile | `/profile` | Student | User profile management |
| Accommodations | `/accommodations` | Public | Browse all accommodations with filters |
| Accommodation Detail | `/accommodations/:id` | Public | SSI score, reports, owner response, voice readout |
| Map | `/map` | Public | Interactive safety map with route intelligence |
| Owner Dashboard | `/owner/dashboard` | Owner | Property management, report responses |
| Add Property | `/owner/add-property` | Owner | Add/edit property with location picker |
| Admin Dashboard | `/admin` | Admin | Moderation, AI analytics, user management |
| Admin Verifications | `/admin/owner-verifications` | Admin | Owner document review |
| Analytics | `/analytics` | Public | Dashboard analytics |
| Not Found | `*` | Public | 404 page |

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- MongoDB Atlas account
- API keys: Mistral, Groq, Gemini, Cloudinary, Sarvam AI (optional), ElevenLabs (optional)

### Quick Start (Windows)

```bash
git clone https://github.com/Sreekarji/safestay.git
cd safestay
start.bat
```

### Manual Start

```bash
# Backend
cd server
npm install
cp .env.example .env   # Edit with your API keys
npm run dev             # http://localhost:5000

# Frontend (separate terminal)
cd client
npm install
npm run dev             # http://localhost:5173
```

### Environment Variables

**server/.env:**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5000
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MISTRAL_API_KEY=...
GROQ_API_KEY=...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
EMAIL_USER=...
EMAIL_PASS=...
FRONTEND_URL=http://localhost:5173
```

**client/.env:**
```
VITE_API_URL=http://localhost:5000
```

## Architecture

```
Student submits report with image
        │
        ▼
┌─────────────────────────────────┐
│   AI Verification Pipeline      │
│   (3 models in parallel)        │
│                                 │
│  Mistral Pixtral ─┐             │
│  Groq Llama 3.3 ──┼─▶ Consensus│
│  Gemini Flash ────┘   (2/3)     │
│                                 │
│  VERIFIED / REJECTED / REVIEW   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   SSI Computation Engine        │
│                                 │
│  - Severity weights             │
│  - Category multipliers         │
│  - Time decay (365 days)        │
│  - Upvote amplification         │
│  - Resolution bonus             │
│                                 │
│  Score: 0-100                   │
│  Label: Safe / Caution / Unsafe │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Interactive Map               │
│                                 │
│  - Color-coded markers          │
│  - Route intelligence           │
│  - Timeline history             │
│  - Voice readout (ElevenLabs)   │
│  - Risk hotspots                │
└─────────────────────────────────┘
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Student registration |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/register-owner` | — | Owner registration with docs |
| POST | `/api/auth/verify-otp` | — | OTP verification |
| GET | `/api/auth/me` | ✓ | Current user profile |
| GET | `/api/reports` | — | All reports (public) |
| POST | `/api/reports` | ✓ | Submit report (college-verified only) |
| GET | `/api/reports/my-reports` | ✓ | User's reports |
| PUT | `/api/reports/:id` | ✓ | Update report |
| POST | `/api/reports/:id/upvote` | ✓ | Upvote report |
| PUT | `/api/reports/:id/verify` | ✓ | Verify/dispute resolution |
| GET | `/api/accommodations` | — | All accommodations |
| GET | `/api/accommodations/:id` | — | Single accommodation with reports |
| GET | `/api/accommodations/with-location` | — | Map markers |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/admin/reports` | Admin | All reports with filters |
| PUT | `/api/admin/reports/:id/status` | Admin | Update report status |
| GET | `/api/admin/users` | Admin | All users |
| PUT | `/api/admin/users/:id/ban` | Admin | Ban/unban user |
| GET | `/api/admin/owner-verifications` | Admin | Pending owner verifications |
| PUT | `/api/admin/owner-verifications/:id/approve` | Admin | Approve owner |
| PUT | `/api/admin/owner-verifications/:id/reject` | Admin | Reject owner |
| POST | `/api/voice/ssi` | ✓ | Generate voice readout (ElevenLabs) |
| POST | `/api/test-ai-verification` | ✓ | Test AI pipeline |

## Team

- **Sreekar** — Full Stack + AI Integration
- **Praneeth Mukkala** — Backend + Database

## License

MIT
