# SafeStay — 22-Hour Execution Plan

**Start: 11 AM Today | End: 9 AM Tomorrow | Team: 4 People**

---

## ROLES & BRANCHES

| Person | Role | Branch | Focus |
|--------|------|--------|-------|
| P1 | Backend Lead | feature/backend-auth-ai | MongoDB, APIs, SSI |
| P2 | AI Integration | feature/backend-auth-ai | Mistral + Groq + Gemini + ElevenLabs |
| P3 | Frontend Lead | feature/frontend-ui | React UI + Sarvam AI |
| P4 | Maps & Deploy | feature/maps-dashboard | Leaflet + Dashboard + Vultr |

---

## PHASE 1: CORE (11 AM - 7 PM) — 8 Hours

### P1 (Backend)
- [ ] MongoDB Atlas setup + connection
- [ ] User model + auth APIs (register/login/OTP)
- [ ] Report model + submission API
- [ ] Accommodation model + CRUD
- [ ] Basic SSI computation
- [ ] Cloudinary image upload
- **Done by 5 PM**

### P2 (AI)
- [ ] Mistral Pixtral API integration
- [ ] Groq Llama API integration  
- [ ] Gemini Flash API integration
- [ ] Basic verification pipeline
- [ ] Pre-cached responses for demo
- **Done by 6 PM**

### P3 (Frontend)
- [ ] Vite + React + Tailwind setup
- [ ] Auth pages (Login/Register)
- [ ] Report submission form
- [ ] API service layer
- **Done by 5 PM**

### P4 (Maps)
- [ ] Leaflet + OpenStreetMap setup
- [ ] Color-coded SSI markers
- [ ] Basic popups
- **Done by 6 PM**

**7 PM CHECKPOINT:** Merge all to main. Test end-to-end.

---

## PHASE 2: PARTNERS (7 PM - 3 AM) — 8 Hours

### P1 (Backend)
- [ ] Advanced SSI aggregation pipeline
- [ ] Dashboard analytics APIs
- [ ] Area risk analytics
- **Done by 11 PM**

### P2 (AI)
- [ ] Multi-model consensus algorithm
- [ ] ElevenLabs voice synthesis
- [ ] AI fallback mechanism
- **Done by 1 AM**

### P3 (Frontend)
- [ ] Sarvam AI Telugu + Hindi integration
- [ ] Language toggle component
- [ ] Report detail with AI verdict
- **Done by 2 AM**

### P4 (Maps)
- [ ] Dashboard charts (Recharts)
- [ ] Vultr deployment + Docker
- **Done by 3 AM**

**3 AM CHECKPOINT:** Full demo flow working. Vultr live.

---

## PHASE 3: POLISH (3 AM - 9 AM) — 6 Hours

### P1
- [ ] Seed demo data (10 accommodations, 30 reports)
- [ ] Pre-cached AI results

### P2
- [ ] AI fallback testing
- [ ] Pre-generated ElevenLabs audio

### P3
- [ ] UI polish + loading states
- [ ] Pre-generated Sarvam translations

### P4
- [ ] Map optimization
- [ ] Backup screenshots

**8 AM:** Full demo rehearsal (3x)

---

## API CONTRACT

**Base URL:** `http://localhost:5000/api`

**Auth Header:** `Authorization: Bearer <token>`

**Key Endpoints:**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/reports (multipart/form-data)
- GET /api/accommodations
- GET /api/map/markers
- GET /api/analytics/dashboard

---

## ENV FILES NEEDED

**Backend (.env):**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MISTRAL_API_KEY=...
GROQ_API_KEY=...
GEMINI_API_KEY=...
SARVAM_API_KEY=...
ELEVENLABS_API_KEY=...
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000/api
```

---

## MERGE RULES

1. **No direct commits to main**
2. **PR required** — reviewed by team lead
3. **Merge every 4 hours** at checkpoints
4. **Conflicts:** Team lead resolves immediately

---

## DEMO FLOW (3 min)

1. **Map** — Show Hyderabad with SSI markers (30 sec)
2. **Report** — Submit report, AI verifies live (45 sec)
3. **Multilingual** — Toggle Telugu/Hindi, play voice (30 sec)
4. **Resolution** — Owner fixes, student verifies (30 sec)
5. **MongoDB** — Show Atlas live, aggregation pipeline (30 sec)
6. **Closing** — "SafeStay: AI-powered Safety Intelligence" (15 sec)

---

## CRITICAL PATH

1. MongoDB Atlas live
2. Auth working
3. Report submission
4. AI verification (3 models)
5. SSI computation
6. Map markers
7. Sarvam AI multilingual
8. Vultr deployment

**Everything else is optional.**

---

**START BUILDING AT 11 AM. GO!**
