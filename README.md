# SafeStay

An AI-powered Safety Intelligence Network for student accommodations. Verified college students report safety issues about PGs, hostels, and student housing. Multi-model AI (Mistral + Groq) verifies every report before publication. A dynamic SafeStay Safety Index (SSI) per accommodation is displayed on an interactive OpenStreetMap.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Version](https://img.shields.io/badge/Version-2.4.0--pro-blue) ![License](https://img.shields.io/badge/License-MIT-yellow) ![AI](https://img.shields.io/badge/AI-Mistral%20%2B%20Groq-purple) ![Security](https://img.shields.io/badge/Security-Verified%20Only-red)

---

## Why SafeStay Exists

Students choose accommodation based on fake reviews, broker influence, and misleading advertisements. The result: food poisoning, poor sanitation, unsafe infrastructure, security threats, and water quality issues.

SafeStay introduces **verified, AI-powered, student-driven safety intelligence** where only verified students can report and only verified owners can list properties.

---

## Core Features

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
- Rejection with detailed feedback and re-application support

### AI-Powered Report Verification
- **Mistral Pixtral 12B** — Vision model analyzes uploaded images for relevance to the complaint type
- **Groq Llama 3.3 70B** — Context model validates complaint legitimacy and produces final verdict
- Two models run in parallel via `Promise.allSettled`
- Combined confidence scoring with auto-moderation
- Verdicts: VERIFIED (≥85% confidence, auto-approved), NEEDS_REVIEW (60-84%, admin reviews), REJECTED (<60%, auto-flagged)
- Fallback logic when either model is unavailable

### SafeStay Safety Index (SSI)
- Dynamic 0-100 score per accommodation
- Calculated from: report severity, category multipliers, time decay, upvote counts, and resolution status
- Color-coded: Green (≥80, Safe), Yellow (50-79, Caution), Red (<50, Unsafe)
- Automatically recalculated when reports are added, resolved, or disputed
- Time decay — older reports gradually lose weight over 365 days

### Report Resolution Lifecycle
- Complete cycle: Submit → AI Verify → Approve → Resolve → Verify/Dispute
- 7 statuses: Pending, AI Verified, Approved, Resolved, Verified, Disputed, Rejected
- Owner resolves with action description and proof images
- Student verifies fix or disputes it
- Admin can reopen disputed reports
- Trust score updates dynamically based on resolution outcomes

### Interactive Map
- OpenStreetMap with Leaflet
- Color-coded markers by SSI (green/yellow/red)
- Location search via Nominatim geocoding (free, no API key)
- GPS "My Location" button for nearby discovery
- Radius filter (2km, 5km, 10km, 20km, 50km)
- Nearby accommodations sorted by haversine distance
- Fly-to animation on search

### Upvote System
- "I experienced this too" confirmation button
- Toggle upvote with optimistic UI
- Users cannot upvote their own reports
- Upvote count amplifies SSI penalty weight

### Counter-Report System
- Owners can dispute reports they believe are false, outdated, or malicious
- Reasons: false_information, outdated_issue, mistaken_identity, resolved_issue, malicious_intent, other
- Admin reviews counter-reports and accepts or rejects them

---

## Authentication and Security

- JWT-based authentication with 7-day expiry
- bcrypt password hashing (salt rounds: 10)
- Role-based access control (Student / Owner / Admin)
- OTP email verification for account activation
- OTP-based forgot password flow
- Rate limiting: 20 attempts/15min on auth, 100 requests/15min on API
- Helmet security headers
- CORS configuration
- Ban/Unban system for users
- ObjectId validation on all routes
- Input validation and sanitization

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
- AI verification analytics (Mistral + Groq performance)
- Report moderation with AI confidence scores
- User management (ban/unban)
- Owner verification management (approve/reject/revert)
- Counter-report review

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI Library |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS v4 | Styling |
| React Router v7 | Navigation |
| Context API | State Management |
| Leaflet + React-Leaflet | Interactive Maps |
| OpenStreetMap | Map Tiles and Geocoding |
| React Icons | Icon Library |
| date-fns | Date Formatting |
| clsx + tailwind-merge | Class Utilities |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js v5 | Web Framework |
| MongoDB Atlas | Cloud Database |
| Mongoose v9 | ODM |
| JWT | Authentication |
| bcryptjs | Password Security |
| Cloudinary | Image and Document Storage |
| Nodemailer | Email OTP Service |
| Multer | File Upload Handling |
| Helmet | Security Headers |
| express-rate-limit | Rate Limiting |

### AI
| Model | Role |
|---|---|
| Mistral Pixtral 12B | Vision analysis of uploaded evidence images |
| Groq Llama 3.3 70B | Context validation and final verdict summarization |

---

## Project Structure

```
student-accommodation-safety-platform/
│
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AccommodationMap.tsx  # Interactive map with search, GPS, radius filter
│   │   │   ├── ErrorBoundary.tsx     # React error boundary with retry
│   │   │   ├── Footer.tsx            # Footer with branding
│   │   │   ├── Header.tsx            # Sticky navbar with role-based navigation
│   │   │   ├── ImageGallery.tsx      # Thumbnail grid with fullscreen lightbox
│   │   │   ├── ImageUpload.tsx       # Drag-and-drop upload to Cloudinary
│   │   │   ├── ImageWithFallback.tsx # Lazy loading with error placeholder
│   │   │   ├── LocationPicker.tsx    # Leaflet click-to-set-location for owners
│   │   │   ├── ParallaxEffect.tsx    # Scroll reveal and parallax animation hooks
│   │   │   ├── ReportCard.tsx        # Report card with AI insights and resolution UI
│   │   │   ├── TrustScoreBadge.tsx   # Color-coded SSI badge (Safe/Caution/Unsafe)
│   │   │   ├── UpvoteButton.tsx      # "I experienced this too" toggle
│   │   │   └── VerifiedBadge.tsx     # Verified student badge with college tooltip
│   │   │
│   │   ├── pages/
│   │   │   ├── AccommodationDetail.tsx   # Single accommodation with reports and resolution
│   │   │   ├── AccommodationList.tsx     # Browse, search, filter accommodations
│   │   │   ├── AddProperty.tsx           # Add property with Leaflet map picker
│   │   │   ├── AdminDashboard.tsx        # Admin stats, AI analytics, moderation
│   │   │   ├── AdminOwnerVerifications.tsx # Owner document verification management
│   │   │   ├── Dashboard.tsx             # Student dashboard with reports and upvotes
│   │   │   ├── ForgotPassword.tsx        # 3-step OTP password reset
│   │   │   ├── Home.tsx                  # Landing page with parallax and counters
│   │   │   ├── Login.tsx                 # Student/admin login
│   │   │   ├── MyReports.tsx             # User's own reports with filter and search
│   │   │   ├── OwnerDashboard.tsx        # Owner property and report management
│   │   │   ├── OwnerLogin.tsx            # Owner-specific login
│   │   │   ├── OwnerRegister.tsx         # Owner registration with document upload
│   │   │   ├── Profile.tsx               # Role-based profile with stats
│   │   │   ├── Register.tsx              # Student registration with password strength
│   │   │   ├── ReportIncident.tsx        # Multi-step report submission (verified students)
│   │   │   ├── ReportSafety.tsx          # Legacy report form (not routed)
│   │   │   └── VerifyEmail.tsx           # OTP email verification
│   │   │
│   │   ├── contexts/
│   │   │   ├── AccommodationContext.tsx   # Client-side accommodation state
│   │   │   └── AuthContext.tsx            # Auth state, login, register, token management
│   │   │
│   │   ├── utils/
│   │   │   └── cn.ts                     # clsx + tailwind-merge utility
│   │   │
│   │   ├── App.tsx                    # Router with role-based protected routes
│   │   ├── index.css                  # Global styles and Tailwind config
│   │   └── main.tsx                   # Entry point
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
│
├── server/                          # Express Backend
│   ├── models/
│   │   ├── Accommodation.js          # Accommodation with SSI, GeoJSON location
│   │   ├── CounterReport.js          # Owner counter-evidence schema
│   │   ├── OTP.js                    # OTP verification with TTL index
│   │   ├── Report.js                 # Report with AI verification data
│   │   └── User.js                   # User with student/owner verification fields
│   │
│   ├── middleware/
│   │   ├── adminMiddleware.js        # Admin role check
│   │   ├── authMiddleware.js         # JWT verification
│   │   └── ownerMiddleware.js        # Owner role + verification status check
│   │
│   ├── routes/
│   │   ├── auth.js                   # Signup, login, owner registration, OTP
│   │   └── admin.js                  # Admin routes (owner verification, moderation)
│   │
│   ├── utils/
│   │   ├── aiVerification.js         # Mistral + Groq parallel verification engine
│   │   ├── collegeVerification.js    # 250+ Indian college email domain checker
│   │   ├── emailService.js           # Nodemailer email sending
│   │   ├── emailTemplates.js         # HTML email templates
│   │   └── trustScore.js             # SSI calculation algorithm
│   │
│   ├── config/
│   │   └── cloudinary.js             # Cloudinary configuration
│   │
│   ├── server.js                     # Express app, all route definitions
│   ├── createAdmin.js                # Admin creation script
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── README.md
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/auth/signup | Register new student | No |
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

---

## System Architecture

```
Frontend (React + TypeScript + Tailwind + Leaflet)
    │
    ├── AuthContext + Protected Routes + Role-Based UI
    │
    ├── Verification Gate:
    │   ├── Student: College email verified → can submit reports
    │   └── Owner: Documents verified → can add properties and resolve reports
    │
    ▼
Backend (Express REST API)
    │
    ├── Middleware Chain:
    │   ├── authMiddleware (JWT verification)
    │   ├── ownerMiddleware (owner role + verification status)
    │   └── adminMiddleware (admin role check)
    │
    ├── AI Verification Layer:
    │   ├── Mistral Pixtral 12B (vision — analyzes uploaded image)
    │   └── Groq Llama 3.3 70B (context — validates complaint, produces verdict)
    │
    ▼
MongoDB Atlas:
    ├── Users (student/owner verification fields, ban status)
    ├── Reports (AI verification data, resolution, upvotes)
    ├── Accommodations (SSI score, GeoJSON location, trust labels)
    ├── CounterReports (owner disputes)
    └── OTPs (TTL-indexed, auto-expire)
    │
    ▼
External Services:
    ├── Cloudinary (images and documents)
    ├── Nominatim (geocoding — free, no API key)
    ├── Mistral API (vision AI)
    ├── Groq API (context AI)
    └── Nodemailer (email OTP and notifications)
```

---

## SSI Calculation Logic

The SafeStay Safety Index starts at 100 and decreases based on reported issues:

```
penalty = severityWeight × categoryMultiplier × timeDecay × upvoteMultiplier × statusMultiplier

severityWeight:    low=5, medium=15, high=30
categoryMultiplier: Security=1.5, Food Safety=1.3, Water Quality=1.3, Hygiene=1.0, Infrastructure=0.8
timeDecay:         max(0.1, 1 - (daysSinceCreation / 365))
upvoteMultiplier:  1 + (min(upvotes, 20) × 0.1)
statusMultiplier:  verified=0.2, disputed=1.2, resolved=0.5, approved=1.0

SSI = max(0, min(100, 100 - sum(all penalties)))
```

Labels: ≥80 = Safe (green), 50-79 = Caution (yellow), <50 = Unsafe (red)

---

## Installation

### Prerequisites
- Node.js v18+
- npm
- MongoDB Atlas account
- Cloudinary account
- Mistral AI API key
- Groq API key

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/student-accommodation-safety-platform.git
cd student-accommodation-safety-platform
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
PORT=5000
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

FRONTEND_URL=http://localhost:5173

GROQ_API_KEY=your_groq_api_key
MISTRAL_API_KEY=your_mistral_api_key

ADMIN_MASTER_KEY=your_super_secret_master_key_12345
```

Create first admin:

```bash
node createAdmin.js
```

Start backend:

```bash
npm run dev
```

### 3. Frontend

```bash
cd ../client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start frontend:

```bash
npm run dev
```

### 4. Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Admin login: credentials from `createAdmin.js`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| MONGO_URI | Yes | MongoDB Atlas connection string |
| JWT_SECRET | Yes | JWT signing secret (min 32 chars) |
| PORT | No | Server port (default: 5000) |
| CLOUDINARY_CLOUD_NAME | Yes | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Yes | Cloudinary API key |
| CLOUDINARY_API_SECRET | Yes | Cloudinary API secret |
| EMAIL_USER | Yes | Gmail address for OTP emails |
| EMAIL_PASS | Yes | Gmail app password |
| FRONTEND_URL | Yes | Frontend URL for CORS and email links |
| GROQ_API_KEY | Yes | Groq API key for context AI |
| MISTRAL_API_KEY | Yes | Mistral API key for vision AI |
| ADMIN_MASTER_KEY | Yes | Master key for admin creation |

---

## License

MIT License

---

## Author

Praneeth M
Full Stack Developer | MERN Stack | AI Integration Specialist

---

Made with care for student safety and welfare.
