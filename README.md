# SafeStay — AI-Powered Safety Intelligence Network for Student Accommodations

SafeStay is an AI-powered safety intelligence platform where verified college students report safety issues about student accommodations (PGs, hostels). A 3-model AI consensus pipeline (Mistral Pixtral 12B + Groq Llama 3.3 70B + Gemini 2.0 Flash) verifies every report. A dynamic SafeStay Safety Index (SSI) score (0–100) is computed per accommodation and displayed on an interactive OpenStreetMap.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Version](https://img.shields.io/badge/Version-3.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow) ![AI](https://img.shields.io/badge/AI-3--Model%20Consensus-purple) ![Security](https://img.shields.io/badge/Security-Verified%20Only-red)

---

## Why SafeStay Exists

Students choose accommodation based on fake reviews, broker influence, and misleading advertisements. The result: food poisoning, poor sanitation, unsafe infrastructure, security threats, and water quality issues.

SafeStay introduces **verified, AI-powered, student-driven safety intelligence** where only verified students can report and only verified owners can list properties.

---

## Core Features

### AI-Powered Report Verification (3-Model Consensus)
- **Mistral Pixtral 12B** — Vision model analyzes uploaded images for relevance to the complaint type
- **Groq Llama 3.3 70B** — Context model validates complaint legitimacy and produces a verdict
- **Gemini 2.0 Flash** — Secondary validation with weighted confidence scoring
- All three models run in parallel via `Promise.allSettled`
- Consensus requires **2-of-3** models to agree for a VERIFIED verdict
- Confidence weights: Mistral (0.4), Groq (0.35), Gemini (0.25)
- Verdicts: VERIFIED (auto-approved), NEEDS_REVIEW (admin reviews), REJECTED (auto-flagged)
- Fallback logic and pre-cached demo responses when models are unavailable

### SafeStay Safety Index (SSI)
- Dynamic 0–100 score per accommodation
- Calculated from: report severity, category multipliers, time decay, upvote counts, and resolution status
- Color-coded: Green (≥80, Safe), Yellow (50–79, Caution), Red (<50, Unsafe)
- Automatically recalculated when reports are added, resolved, or disputed
- Time decay — older reports gradually lose weight over 365 days

### Report Resolution Lifecycle
- Complete cycle: Submit → AI Verify → Approve → Resolve → Verify/Dispute
- 7 statuses: Pending, AI Verified, Approved, Resolved, Verified, Disputed, Rejected
- Owner resolves with action description and proof images
- Student verifies fix or disputes it
- Admin can reopen disputed reports
- Trust score updates dynamically based on resolution outcomes

### Verified Students Only
- Only students with a verified Indian college email can submit reports
- 250+ college domains recognized (IITs, NITs, IIITs, BITS, VIT, Manipal, state universities)
- Domain-based verification — no OTP required for college check
- Verification status badge displayed on all submissions
- Prevents fake reviews and anonymous abuse

### Verified Owners Only
- Document-based owner verification system
- Required documents: Government ID (Aadhaar/PAN), Property proof (deed/lease), Business registration (optional)
- Admin review and approval process with 4 statuses: Pending, Under Review, Verified, Rejected
- Only verified owners can add properties, resolve reports, and access the owner dashboard

### Interactive Safety Map
- OpenStreetMap with Leaflet + React-Leaflet
- Color-coded markers by SSI (green/yellow/red)
- Location search via Nominatim geocoding (free, no API key)
- GPS "My Location" button for nearby discovery
- Radius filter (2km, 5km, 10km, 20km, 50km)
- Nearby accommodations sorted by haversine distance
- Fly-to animation on search

### Voice Readout (ElevenLabs)
- Text-to-speech safety summaries for accommodations
- ElevenLabs Turbo v2.5 model with fallback for demo mode

### Multilingual Support (i18n)
- English, Hindi (हिन्दी), Telugu (తెలుగు) via react-i18next
- Language toggle component with browser language detection
- Zustand language store for persistence

### Upvote & Counter-Report System
- "I experienced this too" toggle with optimistic UI
- Users cannot upvote their own reports
- Upvote count amplifies SSI penalty weight
- Owners can dispute false/outdated reports with counter-evidence
- Admin reviews counter-reports and accepts or rejects them

---

## Authentication and Security

- JWT-based authentication with 7-day expiry
- bcrypt password hashing (salt rounds: 10)
- Role-based access control (Student / Owner / Admin)
- OTP email verification for account activation
- OTP-based forgot password flow
- Rate limiting: configurable per-route via express-rate-limit
- Helmet security headers
- CORS configuration
- Ban/Unban system for users
- ObjectId validation on all routes
- Input validation via Zod schemas

---

## Dashboard System

### Student Dashboard
- Recent reports across all accommodations
- Personal report listing with status tracking
- Accommodation browse with trust scores
- Upvote functionality

### Owner Dashboard
- Reports against owned properties with AI verification results
- Resolve safety issues with proof images
- Submit counter-reports
- Property management (add/edit/delete accommodations)
- Room occupancy tracking
- Location picker with Leaflet map for setting coordinates

### Admin Dashboard
- Platform statistics (users, accommodations, reports)
- AI verification analytics (3-model performance)
- Report moderation with AI confidence scores
- User management (ban/unban)
- Owner verification management (approve/reject/revert)
- Counter-report review
- Recharts visualizations (SSI trend, category breakdown, area risk)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI Library |
| TypeScript | Type Safety |
| Vite 7 | Build Tool |
| Tailwind CSS 3 | Styling |
| React Router v7 | Navigation |
| Zustand | State Management |
| React Context | Theme, Auth, Map state |
| Leaflet + React-Leaflet | Interactive Maps |
| OpenStreetMap + CARTO | Map Tiles and Geocoding |
| Framer Motion | Animations |
| Recharts | Data Visualizations |
| React Hook Form + Zod | Form Handling and Validation |
| react-i18next | Multilingual (EN/HI/TE) |
| shadcn/ui (Radix UI) | UI Primitives |
| Lucide React | Icon Library |
| Axios | HTTP Client |
| date-fns | Date Formatting |
| clsx + tailwind-merge | Class Utilities |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js 5 | Web Framework |
| TypeScript (via tsx) | Type Safety |
| MongoDB Atlas | Cloud Database |
| Mongoose 9 | ODM |
| JWT | Authentication |
| bcryptjs | Password Security |
| Cloudinary | Image and Document Storage |
| Multer + multer-storage-cloudinary | File Upload Handling |
| Nodemailer | Email OTP Service |
| Helmet | Security Headers |
| express-rate-limit | Rate Limiting |
| Morgan | Request Logging |

### AI Models
| Model | Role | Weight |
|---|---|---|
| Mistral Pixtral 12B | Vision analysis of uploaded evidence images | 0.40 |
| Groq Llama 3.3 70B | Context validation and final verdict summarization | 0.35 |
| Gemini 2.0 Flash | Secondary validation and cross-check | 0.25 |

### Voice
| Technology | Purpose |
|---|---|
| ElevenLabs Turbo v2.5 | Text-to-speech safety summaries |

---

## Project Structure

```
safestay/
├── client/                              # React Frontend (TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                    # LoginForm, RegisterForm, OwnerRegisterForm, OTPVerification
│   │   │   ├── common/                  # ErrorBoundary, ImageUpload, ImageGallery, TrustScoreBadge,
│   │   │   │                              UpvoteButton, VerifiedBadge, LanguageToggle, LocationPicker,
│   │   │   │                              LoadingSpinner, EmptyState, PageTransition
│   │   │   ├── dashboard/               # AnalyticsDashboard, StatsGrid, RiskChart, CategoryBreakdown,
│   │   │   │                              RecentActivity
│   │   │   ├── layout/                  # Layout, Navbar, Footer
│   │   │   ├── reports/                 # ReportForm, ReportCard, ReportFilters, AIVerdict, VoicePlayer
│   │   │   ├── ui/                      # shadcn/ui primitives (button, card, badge, input, dialog, etc.)
│   │   │   ├── AccommodationMap.tsx     # Interactive map with search, GPS, radius filter
│   │   │   ├── Header.tsx               # Sticky navbar with role-based navigation
│   │   │   ├── Footer.tsx               # Footer with branding
│   │   │   ├── ImageWithFallback.tsx    # Lazy loading with error placeholder
│   │   │   ├── LocationPicker.tsx       # Leaflet click-to-set-location for owners
│   │   │   ├── ParallaxEffect.tsx       # Scroll reveal and parallax animation hooks
│   │   │   ├── ReportCard.tsx           # Report card with AI insights and resolution UI
│   │   │   ├── TrustScoreBadge.tsx      # Color-coded SSI badge (Safe/Caution/Unsafe)
│   │   │   ├── UpvoteButton.tsx         # "I experienced this too" toggle
│   │   │   ├── VerifiedBadge.tsx        # Verified student badge with college tooltip
│   │   │   └── VoicePlayer.tsx          # Audio playback for voice summaries
│   │   │
│   │   ├── pages/                       # 25 page components
│   │   │   ├── Home.tsx                 # Landing page with parallax and counters
│   │   │   ├── Login.tsx                # Student/admin login
│   │   │   ├── Register.tsx             # Student registration with password strength
│   │   │   ├── Dashboard.tsx            # Student dashboard with reports and upvotes
│   │   │   ├── MapView.tsx              # Interactive safety map page
│   │   │   ├── AccommodationList.tsx    # Browse, search, filter accommodations
│   │   │   ├── AccommodationDetail.tsx  # Single accommodation with reports and resolution
│   │   │   ├── ReportIncident.tsx       # Multi-step report submission (verified students)
│   │   │   ├── ReportSubmit.tsx         # Report submission form
│   │   │   ├── ReportDetail.tsx         # Single report view with resolution tracking
│   │   │   ├── ReportEdit.tsx           # Edit existing report
│   │   │   ├── MyReports.tsx            # User's own reports with filter and search
│   │   │   ├── Profile.tsx              # Role-based profile with stats
│   │   │   ├── OwnerLogin.tsx           # Owner-specific login
│   │   │   ├── OwnerRegister.tsx        # Owner registration with document upload
│   │   │   ├── OwnerDashboard.tsx       # Owner property and report management
│   │   │   ├── AddProperty.tsx          # Add property with Leaflet map picker
│   │   │   ├── AdminDashboard.tsx       # Admin stats, AI analytics, moderation
│   │   │   ├── AdminOwnerVerifications.tsx  # Owner document verification management
│   │   │   ├── VerifyEmail.tsx          # OTP email verification
│   │   │   ├── OTPVerification.tsx      # OTP verification page
│   │   │   ├── ForgotPassword.tsx       # 3-step OTP password reset
│   │   │   ├── Landing.tsx              # Alternate landing page
│   │   │   ├── NotFound.tsx             # 404 page
│   │   │   └── ReportSafety.tsx         # Legacy report form
│   │   │
│   │   ├── contexts/                    # AccommodationContext, AuthContext, MapContext, ThemeContext
│   │   ├── hooks/                       # useAuth, useLanguage
│   │   ├── i18n/                        # i18next config + locales (en.json, hi.json, te.json)
│   │   ├── lib/                         # utils (cn, formatDate, getSSI*), constants, validations (Zod)
│   │   ├── services/                    # api, authService, reportService, accommodationService,
│   │   │                                  mapService, mapData, routeData
│   │   ├── stores/                      # Zustand: authStore, reportStore, languageStore
│   │   ├── types/                       # TypeScript type definitions
│   │   ├── utils/                       # cn utility
│   │   └── App.tsx                      # Router with role-based protected routes
│   │
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── server/                              # Node.js Backend (TypeScript)
│   ├── src/
│   │   ├── config/                      # db (MongoDB), cloudinary
│   │   ├── middleware/                  # authMiddleware, adminMiddleware, ownerMiddleware, rateLimiter
│   │   ├── models/                      # User, Report, Accommodation, OTP, CounterReport,
│   │   │                                  VerificationResult
│   │   ├── routes/                      # auth, reports, accommodations, admin, owner, analytics,
│   │   │                                  aiRoutes, upload, otp, profile
│   │   ├── services/
│   │   │   ├── ai/                      # mistralService, groqService, geminiService,
│   │   │   │                              verificationPipeline, preCachedResponses
│   │   │   └── voice/                   # elevenLabsService
│   │   ├── utils/                       # collegeVerification, emailService, emailTemplates, trustScore
│   │   ├── scripts/                     # seed, debugMistral, testServices
│   │   └── index.ts                     # Express app entry point
│   │
│   ├── server.js                        # Legacy CommonJS server (still functional)
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── docs/                                # API.md, DATABASE.md, EXECUTION_PLAN.md
├── start.bat                            # One-click start (backend + frontend)
├── setup.bat                            # Setup script (install deps, seed DB)
├── DESIGN.md                            # Vercel-inspired design system spec
└── README.md
```

---

## Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Landing | `/` | Public | Hero, features, stats, CTA |
| Login | `/login` | Public | Student/admin login |
| Register | `/register` | Public | Student registration with college verification |
| Verify Email | `/verify-email` | Public | Email OTP verification |
| Verify OTP | `/verify-otp` | Public | OTP verification page |
| Forgot Password | `/forgot-password` | Public | OTP-based password reset |
| Owner Login | `/owner/login` | Public | Property owner login |
| Owner Register | `/owner/register` | Public | Owner registration with document upload |
| Dashboard | `/dashboard` | Student | Personal dashboard with stats and recent activity |
| Report Submit | `/report` | Student | Multi-step report form with image upload |
| Report Incident | `/report-incident` | Student | Advanced report form with AI verification |
| My Reports | `/my-reports` | Student | All submitted reports with status tracking |
| Report Detail | `/report/:id` | Student | Single report view with resolution tracking |
| Report Edit | `/report/:id/edit` | Student | Edit existing report |
| Profile | `/profile` | Student | User profile management |
| Map | `/map` | Public | Interactive safety map with markers and search |
| Accommodations | `/accommodations` | Public | Browse all accommodations with filters |
| Accommodation Detail | `/accommodations/:id` | Public | SSI score, reports, owner response, voice readout |
| Owner Dashboard | `/owner/dashboard` | Owner | Property management, report responses |
| Add Property | `/owner/add-property` | Owner | Add/edit property with location picker |
| Admin Dashboard | `/admin` | Admin | Moderation, AI analytics, user management |
| Admin Verifications | `/admin/owner-verifications` | Admin | Owner document review |
| Analytics | `/analytics` | Public | Dashboard analytics |
| Not Found | `*` | Public | 404 page |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Register new student | No |
| POST | /api/auth/login | Login user | No |
| POST | /api/auth/register-owner | Register owner with document upload | No |
| GET | /api/auth/me | Get current user | Yes |
| GET | /api/auth/owner/verification-status | Poll owner verification status | Owner |

### OTP
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/otp/send-verification | Send email verification OTP | No |
| POST | /api/otp/verify-email | Verify email with OTP | No |
| POST | /api/otp/send-college-verification | Send college verification OTP | Yes |
| POST | /api/otp/verify-college | Verify college email | Yes |
| POST | /api/otp/forgot-password | Send password reset OTP | No |
| POST | /api/otp/reset-password | Reset password with OTP | No |

### Accommodations
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/accommodations | Search and filter accommodations | No |
| GET | /api/accommodations/dropdown | Dropdown list for report form | Yes |
| GET | /api/accommodations/with-location | Map data with lat/lng and SSI | No |
| GET | /api/accommodations/:id | Single accommodation with approved reports | No |
| POST | /api/accommodations/:id/recalculate-score | Recalculate SSI | Yes |

### Reports
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/reports | Submit report (AI verification runs automatically) | Verified Student |
| GET | /api/reports | Get all reports | No |
| GET | /api/reports/my-reports | Get own reports (paginated) | Yes |
| PUT | /api/reports/:id | Update report (re-runs AI if images changed) | Yes |
| DELETE | /api/reports/:id | Delete own report | Yes |
| POST | /api/reports/:id/upvote | Toggle upvote | Yes |
| PUT | /api/reports/:id/verify | Verify or dispute owner resolution | Yes |
| GET | /api/reports/:id/resolution | Get resolution details | Yes |

### Image Upload
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/upload | Upload up to 5 images to Cloudinary | Yes |
| DELETE | /api/upload/:publicId | Delete image from Cloudinary | Yes |

### Owner (Verified Only)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/owner/stats | Owner dashboard statistics | Verified Owner |
| GET | /api/owner/accommodations | Get owned accommodations | Verified Owner |
| POST | /api/owner/accommodations | Add new accommodation | Verified Owner |
| PUT | /api/owner/accommodations/:id | Update accommodation | Verified Owner |
| DELETE | /api/owner/accommodations/:id | Delete accommodation | Verified Owner |
| PUT | /api/owner/accommodations/:id/occupancy | Update room occupancy | Verified Owner |
| GET | /api/owner/reports | Get reports against owned properties | Verified Owner |
| PUT | /api/owner/reports/:id/resolve | Resolve report with proof | Verified Owner |
| POST | /api/owner/counter-report | Submit counter-report | Verified Owner |
| GET | /api/owner/counter-reports | Get owner's counter-reports | Verified Owner |

### Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/admin/stats | Dashboard statistics with AI analytics | Admin |
| GET | /api/admin/reports | All reports with AI filter options | Admin |
| PUT | /api/admin/reports/:id/status | Approve or reject report | Admin |
| PUT | /api/admin/reports/:id/reopen | Reopen disputed report | Admin |
| DELETE | /api/admin/reports/:id | Delete report | Admin |
| GET | /api/admin/users | Get all users | Admin |
| PUT | /api/admin/users/:id/ban | Ban or unban user | Admin |
| GET | /api/admin/counter-reports | Get counter-reports | Admin |
| PUT | /api/admin/counter-reports/:id | Review counter-report | Admin |
| GET | /api/admin/ai-performance | AI verification performance metrics | Admin |
| GET | /api/admin/pending-owners | Get pending owner verifications | Admin |
| PUT | /api/admin/verify-owner/:id | Approve owner | Admin |
| PUT | /api/admin/reject-owner/:id | Reject owner with reason | Admin |

### Profile
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/profile | Get profile with stats | Yes |
| PUT | /api/profile | Update name or profile photo | Yes |
| PUT | /api/profile/password | Change password | Yes |

### AI & Voice
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/voice/ssi | Generate voice readout for accommodation | Yes |
| POST | /api/test-ai-verification | Test AI verification pipeline | Yes |

### Health
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/health | Health check | No |

---

## Architecture

```
Student submits report with image
        │
        ▼
┌─────────────────────────────────────┐
│   AI Verification Pipeline          │
│   (3 models in parallel)            │
│                                     │
│  Mistral Pixtral 12B ─┐             │
│  Groq Llama 3.3 70B  ─┼─▶ Consensus│
│  Gemini 2.0 Flash ────┘   (2/3)     │
│                                     │
│  VERIFIED / REJECTED / REVIEW       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   SSI Computation Engine            │
│                                     │
│  - Severity weights                 │
│  - Category multipliers             │
│  - Time decay (365 days)            │
│  - Upvote amplification             │
│  - Resolution bonus                 │
│                                     │
│  Score: 0-100                       │
│  Label: Safe / Caution / Unsafe     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Frontend Display                  │
│                                     │
│  - Color-coded map markers          │
│  - Accommodation SSI badges         │
│  - Report cards with AI insights    │
│  - Voice readout (ElevenLabs)       │
│  - Admin analytics dashboard        │
│  - Multilingual (EN/HI/TE)          │
└─────────────────────────────────────┘
```

---

## SSI Calculation Logic

The SafeStay Safety Index starts at 100 and decreases based on reported issues:

```
penalty = severityWeight × categoryMultiplier × timeDecay × upvoteMultiplier × statusMultiplier

severityWeight:     low=5, medium=15, high=30
categoryMultiplier: Security=1.5, Food Safety=1.3, Water Quality=1.3, Hygiene=1.0, Infrastructure=0.8
timeDecay:          max(0.1, 1 - (daysSinceCreation / 365))
upvoteMultiplier:   1 + (min(upvotes, 20) × 0.1)
statusMultiplier:   verified=0.2, disputed=1.2, resolved=0.5, approved=1.0

SSI = max(0, min(100, 100 - sum(all penalties)))
```

Labels: ≥80 = Safe (green), 50–79 = Caution (yellow), <50 = Unsafe (red)

---

## Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm
- MongoDB Atlas account
- API keys: Mistral, Groq, Gemini, Cloudinary
- Optional: ElevenLabs (voice), Sarvam AI

### Quick Start (Windows)

```bash
git clone https://github.com/Sreekarji/safestay.git
cd safestay
start.bat
```

The `start.bat` script will:
1. Kill any existing processes on ports 5000 and 5173
2. Start the backend with `npx tsx src/index.ts`
3. Wait for the health check to pass
4. Start the frontend with `npm run dev`
5. Open the browser

### Manual Setup

**Backend:**

```bash
cd server
npm install
cp .env.example .env   # Edit with your API keys
```

Create first admin:
```bash
npx tsx src/scripts/seed.ts
```

Start backend:
```bash
npm run dev
```

**Frontend (separate terminal):**

```bash
cd client
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

---

## Environment Variables

### server/.env

| Variable | Required | Description |
|---|---|---|
| MONGODB_URI | Yes | MongoDB Atlas connection string |
| JWT_SECRET | Yes | JWT signing secret (min 32 chars) |
| PORT | No | Server port (default: 5000) |
| NODE_ENV | No | development / production / demo |
| CLOUDINARY_CLOUD_NAME | Yes | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Yes | Cloudinary API key |
| CLOUDINARY_API_SECRET | Yes | Cloudinary API secret |
| MISTRAL_API_KEY | Yes | Mistral API key for vision AI |
| GROQ_API_KEY | Yes | Groq API key for context AI |
| GEMINI_API_KEY | Yes | Google Gemini API key for secondary validation |
| ELEVENLABS_API_KEY | No | ElevenLabs API key for voice TTS |
| ELEVENLABS_VOICE_ID | No | ElevenLabs voice ID |
| EMAIL_USER | Yes | Gmail address for OTP emails |
| EMAIL_PASS | Yes | Gmail app password |
| FRONTEND_URL | Yes | Frontend URL for CORS and email links |
| ADMIN_MASTER_KEY | Yes | Master key for admin creation |
| DEMO_MODE | No | Set to true to skip MongoDB connection |

### client/.env

| Variable | Required | Description |
|---|---|---|
| VITE_API_URL | Yes | Backend API URL (default: http://localhost:5000) |

---

## Documentation

- [API Reference](docs/API.md) — Detailed API documentation
- [Database Schema](docs/DATABASE.md) — MongoDB models and relationships
- [Execution Plan](docs/EXECUTION_PLAN.md) — Development roadmap
- [Design System](DESIGN.md) — Vercel-inspired design language spec

---

## Team

- **Sreekar** — Full Stack + AI Integration
- **Praneeth Mukkala** — Backend + Database

---

## License

MIT License

---

Made with care for student safety and welfare.
