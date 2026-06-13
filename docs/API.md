# SafeStay — REST API Specification

**Base URL:** `http://localhost:5000/api` (development) | `https://api.safestay.live/api` (production)

**Authentication:** Bearer token in Authorization header
```
Authorization: Bearer <jwt_token>
```

**Response Format:**
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

**Error Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "student@college.edu",
  "password": "SecurePass123!",
  "name": "Rahul Kumar",
  "phone": "+919876543210",
  "role": "student",
  "college": "IIIT Hyderabad",
  "studentId": "IIIT2023001"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d5ecb54b24a12345678901",
      "email": "student@college.edu",
      "name": "Rahul Kumar",
      "role": "student",
      "isVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful. Please verify your email."
}
```

### POST /api/auth/login
Login with email and password.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "student@college.edu",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d5ecb54b24a12345678901",
      "email": "student@college.edu",
      "name": "Rahul Kumar",
      "role": "student",
      "isVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### POST /api/auth/verify-otp
Verify email with OTP.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "student@college.edu",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### GET /api/auth/me
Get current user profile.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb54b24a12345678901",
    "email": "student@college.edu",
    "name": "Rahul Kumar",
    "role": "student",
    "college": "IIIT Hyderabad",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Accommodation Endpoints

### GET /api/accommodations
Get all accommodations with optional filters.

**Auth Required:** No

**Query Parameters:**
- `area` (string): Filter by area (e.g., "Ameerpet")
- `type` (string): Filter by type ("pg", "hostel", "apartment")
- `minSSI` (number): Minimum SSI score
- `maxSSI` (number): Maximum SSI score
- `limit` (number): Results per page (default: 20)
- `page` (number): Page number (default: 1)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accommodations": [
      {
        "_id": "60d5ecb54b24a12345678902",
        "name": "Green Valley PG",
        "type": "pg",
        "area": "Ameerpet",
        "ssi": 85,
        "reportCount": 12,
        "location": {
          "type": "Point",
          "coordinates": [78.3848, 17.4401]
        },
        "images": ["https://res.cloudinary.com/..."]
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

### GET /api/accommodations/:id
Get accommodation details.

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb54b24a12345678902",
    "name": "Green Valley PG",
    "type": "pg",
    "address": "123, Ameerpet Main Road",
    "area": "Ameerpet",
    "city": "Hyderabad",
    "ssi": 85,
    "ssiHistory": [
      { "score": 82, "date": "2024-01-01T00:00:00Z", "reportCount": 8 },
      { "score": 85, "date": "2024-02-01T00:00:00Z", "reportCount": 12 }
    ],
    "categoryScores": {
      "fire_safety": 90,
      "water_quality": 80,
      "structural": 85,
      "electrical": 88,
      "hygiene": 82,
      "security": 85
    },
    "reports": [...],
    "owner": { "name": "Owner Name", "phone": "+919876543210" }
  }
}
```

### POST /api/accommodations
Create a new accommodation (Owner only).

**Auth Required:** Yes (role: owner, admin)

**Request Body:**
```json
{
  "name": "New PG",
  "type": "pg",
  "address": "456, Madhapur",
  "area": "Madhapur",
  "pincode": "500081",
  "location": {
    "coordinates": [78.3848, 17.4401]
  },
  "amenities": ["WiFi", "AC", "Laundry"],
  "capacity": 50,
  "monthlyRent": 8000,
  "contactPhone": "+919876543210",
  "contactEmail": "owner@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb54b24a12345678903",
    "name": "New PG",
    "ssi": 50,
    "ownerId": "60d5ecb54b24a12345678901"
  },
  "message": "Accommodation created successfully"
}
```

### PUT /api/accommodations/:id
Update accommodation details.

**Auth Required:** Yes (owner of accommodation or admin)

**Request Body:** (partial update)
```json
{
  "monthlyRent": 8500,
  "amenities": ["WiFi", "AC", "Laundry", "Gym"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Accommodation updated successfully"
}
```

---

## Report Endpoints

### POST /api/reports
Submit a new safety report.

**Auth Required:** Yes (role: student)

**Request Body (multipart/form-data):**
```
accommodationId: 60d5ecb54b24a12345678902
category: fire_safety
severity: 8
title: Broken Fire Extinguisher
description: The fire extinguisher on the 2nd floor is expired and not functional.
images: [file1.jpg, file2.jpg]
isAnonymous: false
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb54b24a12345678904",
    "accommodationId": "60d5ecb54b24a12345678902",
    "category": "fire_safety",
    "severity": 8,
    "status": "pending",
    "images": ["https://res.cloudinary.com/..."]
  },
  "message": "Report submitted. AI verification in progress."
}
```

### GET /api/reports
Get reports with optional filters.

**Auth Required:** No

**Query Parameters:**
- `accommodationId` (string): Filter by accommodation
- `status` (string): Filter by status ("pending", "verified", "rejected", "resolved")
- `category` (string): Filter by category
- `limit` (number): Results per page
- `page` (number): Page number

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "_id": "60d5ecb54b24a12345678904",
        "accommodationId": {
          "_id": "60d5ecb54b24a12345678902",
          "name": "Green Valley PG"
        },
        "category": "fire_safety",
        "severity": 8,
        "title": "Broken Fire Extinguisher",
        "status": "verified",
        "aiVerification": {
          "consensus": "accept",
          "overallConfidence": 0.92
        },
        "createdAt": "2024-02-15T14:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### GET /api/reports/:id
Get report details with AI verification results.

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb54b24a12345678904",
    "accommodationId": { ... },
    "userId": { "name": "Rahul Kumar", "college": "IIIT Hyderabad" },
    "category": "fire_safety",
    "severity": 8,
    "title": "Broken Fire Extinguisher",
    "description": "The fire extinguisher on the 2nd floor is expired...",
    "images": [...],
    "status": "verified",
    "aiVerification": {
      "mistral": {
        "verdict": "accept",
        "confidence": 0.95,
        "reasoning": "Image clearly shows expired fire extinguisher..."
      },
      "groq": {
        "verdict": "accept",
        "confidence": 0.88,
        "reasoning": "Context matches fire safety violation..."
      },
      "gemini": {
        "verdict": "accept",
        "confidence": 0.93,
        "reasoning": "Image and description consistent..."
      },
      "consensus": "accept",
      "overallConfidence": 0.92
    },
    "ownerResponse": null,
    "studentVerification": null
  }
}
```

### PUT /api/reports/:id/resolve
Owner responds to a report with resolution.

**Auth Required:** Yes (owner of accommodation)

**Request Body (multipart/form-data):**
```
response: Fixed the fire extinguisher. New one installed.
proofImages: [proof.jpg]
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Response submitted. Awaiting student verification."
}
```

### PUT /api/reports/:id/verify-resolution
Student verifies if the issue is resolved.

**Auth Required:** Yes (original report author)

**Request Body:**
```json
{
  "isResolved": true,
  "feedback": "Issue has been fixed. Fire extinguisher is now functional."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Resolution verified. SSI will be updated."
}
```

---

## AI Verification Endpoints

### POST /api/ai/verify
Trigger AI verification for a report.

**Auth Required:** Yes (admin)

**Request Body:**
```json
{
  "reportId": "60d5ecb54b24a12345678904"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "mistral": {
      "verdict": "accept",
      "confidence": 0.95,
      "reasoning": "Image clearly shows expired fire extinguisher..."
    },
    "groq": {
      "verdict": "accept",
      "confidence": 0.88,
      "reasoning": "Context matches fire safety violation..."
    },
    "gemini": {
      "verdict": "accept",
      "confidence": 0.93,
      "reasoning": "Image and description consistent..."
    },
    "consensus": "accept",
    "overallConfidence": 0.92,
    "processingTime": 4500
  },
  "message": "Verification complete"
}
```

### GET /api/ai/status
Check AI pipeline status.

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "mistral": { "status": "online", "latency": 1200 },
    "groq": { "status": "online", "latency": 800 },
    "gemini": { "status": "online", "latency": 950 },
    "pipeline": "operational"
  }
}
```

---

## Dashboard Analytics Endpoints

### GET /api/analytics/dashboard
Get dashboard analytics data.

**Auth Required:** Yes (admin)

**Query Parameters:**
- `days` (number): Number of days to analyze (default: 30)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAccommodations": 50,
      "totalReports": 156,
      "verifiedReports": 120,
      "averageSSI": 68
    },
    "trends": {
      "reportsByDay": [
        { "date": "2024-02-01", "count": 5 },
        { "date": "2024-02-02", "count": 8 }
      ],
      "ssiTrend": [
        { "date": "2024-02-01", "avgSSI": 65 },
        { "date": "2024-02-02", "avgSSI": 67 }
      ]
    },
    "categoryBreakdown": {
      "fire_safety": 45,
      "water_quality": 32,
      "structural": 28,
      "electrical": 18,
      "hygiene": 22,
      "security": 11
    },
    "riskDistribution": {
      "low": 20,
      "medium": 18,
      "high": 12
    }
  }
}
```

### GET /api/analytics/area-risk
Get area risk analytics.

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "areas": [
      {
        "area": "Ameerpet",
        "avgSSI": 62,
        "accommodationCount": 12,
        "totalReports": 45,
        "riskLevel": "medium"
      },
      {
        "area": "Madhapur",
        "avgSSI": 75,
        "accommodationCount": 8,
        "totalReports": 22,
        "riskLevel": "low"
      }
    ]
  }
}
```

### GET /api/analytics/accommodations/:id/trend
Get SSI trend for a specific accommodation.

**Auth Required:** No

**Query Parameters:**
- `months` (number): Number of months (default: 6)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accommodationId": "60d5ecb54b24a12345678902",
    "name": "Green Valley PG",
    "trend": [
      { "month": "2024-01", "ssi": 78, "reports": 5 },
      { "month": "2024-02", "ssi": 82, "reports": 8 },
      { "month": "2024-03", "ssi": 85, "reports": 12 }
    ]
  }
}
```

---

## Map Data Endpoints

### GET /api/map/markers
Get all accommodation markers for the map.

**Auth Required:** No

**Query Parameters:**
- `bounds` (string): Map bounds as "south,west,north,east"
- `zoom` (number): Current zoom level

**Response (200):**
```json
{
  "success": true,
  "data": {
    "markers": [
      {
        "_id": "60d5ecb54b24a12345678902",
        "name": "Green Valley PG",
        "location": {
          "type": "Point",
          "coordinates": [78.3848, 17.4401]
        },
        "ssi": 85,
        "riskLevel": "low",
        "reportCount": 12,
        "type": "pg"
      }
    ],
    "clusters": [
      {
        "center": [78.38, 17.44],
        "count": 5,
        "avgSSI": 72
      }
    ]
  }
}
```

### GET /api/map/heatmap
Get heatmap data for area risk visualization.

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "points": [
      {
        "location": [78.3848, 17.4401],
        "intensity": 0.85,
        "ssi": 85
      }
    ]
  }
}
```

---

## Admin Endpoints

### GET /api/admin/reports/pending
Get all pending reports for admin review.

**Auth Required:** Yes (admin)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "_id": "60d5ecb54b24a12345678904",
        "accommodationId": { "name": "Green Valley PG" },
        "category": "fire_safety",
        "severity": 8,
        "title": "Broken Fire Extinguisher",
        "status": "pending",
        "createdAt": "2024-02-15T14:30:00Z"
      }
    ]
  }
}
```

### PUT /api/admin/reports/:id/approve
Admin manually approves a report.

**Auth Required:** Yes (admin)

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Report approved"
}
```

### PUT /api/admin/reports/:id/reject
Admin manually rejects a report.

**Auth Required:** Yes (admin)

**Request Body:**
```json
{
  "reason": "Duplicate report"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Report rejected"
}
```

### GET /api/admin/users
Get all users.

**Auth Required:** Yes (admin)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "60d5ecb54b24a12345678901",
        "email": "student@college.edu",
        "name": "Rahul Kumar",
        "role": "student",
        "isVerified": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## Sarvam AI Endpoints

### POST /api/sarvam/translate
Translate text to specified language.

**Auth Required:** No

**Request Body:**
```json
{
  "text": "Green Valley PG has a SafeStay Safety Index of 85",
  "targetLanguage": "te"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "original": "Green Valley PG has a SafeStay Safety Index of 85",
    "translated": "గ్రీన్ వ్యాలీ PG యొక్క SafeStay భద్రతా సూచిక 85",
    "language": "te"
  }
}
```

### GET /api/sarvam/languages
Get supported languages.

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "languages": [
      { "code": "en", "name": "English" },
      { "code": "te", "name": "Telugu" },
      { "code": "hi", "name": "Hindi" }
    ]
  }
}
```

---

## ElevenLabs Endpoints

### POST /api/voice/synthesize
Generate speech from text.

**Auth Required:** No

**Request Body:**
```json
{
  "text": "Green Valley PG has a SafeStay Safety Index of 85. This accommodation is classified as safe.",
  "voiceId": "21m00Tcm4TlvDq8ikWAM"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "audioUrl": "https://res.cloudinary.com/.../audio.mp3",
    "duration": 8.5
  }
}
```

---

## Rate Limiting

- **General API:** 100 requests per 15 minutes per IP
- **Authentication:** 5 requests per 15 minutes per IP
- **Report Submission:** 10 requests per hour per user
- **AI Verification:** 20 requests per hour per user

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request data |
| `UNAUTHORIZED` | Missing or invalid token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE` | Resource already exists |
| `RATE_LIMITED` | Too many requests |
| `AI_ERROR` | AI service unavailable |
| `UPLOAD_ERROR` | File upload failed |
| `DATABASE_ERROR` | Database operation failed |
