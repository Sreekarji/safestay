# SafeStay — MongoDB Database Schemas

## Overview

All schemas use MongoDB with Mongoose ODM. Timestamps are automatically added.

---

## User Schema

```typescript
// server/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'student' | 'owner' | 'admin';
  college?: string;
  studentId?: string;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'owner', 'admin'],
    default: 'student'
  },
  college: {
    type: String,
    required: function() { return this.role === 'student'; }
  },
  studentId: {
    type: String,
    required: function() { return this.role === 'student'; }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: String,
  otpExpiry: Date
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ college: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
```

---

## Accommodation Schema

```typescript
// server/src/models/Accommodation.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAccommodation extends Document {
  name: string;
  type: 'pg' | 'hostel' | 'apartment';
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  ownerId: mongoose.Types.ObjectId;
  ssi: number; // SafeStay Safety Index (0-100)
  ssiHistory: Array<{
    score: number;
    date: Date;
    reportCount: number;
  }>;
  reportCount: number;
  verifiedReportCount: number;
  amenities: string[];
  capacity: number;
  currentOccupancy: number;
  monthlyRent: number;
  contactPhone: string;
  contactEmail: string;
  images: string[]; // Cloudinary URLs
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const accommodationSchema = new Schema<IAccommodation>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['pg', 'hostel', 'apartment'],
    required: true
  },
  address: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true,
    index: true
  },
  city: {
    type: String,
    required: true,
    default: 'Hyderabad'
  },
  state: {
    type: String,
    required: true,
    default: 'Telangana'
  },
  pincode: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ssi: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  ssiHistory: [{
    score: { type: Number, required: true },
    date: { type: Date, required: true },
    reportCount: { type: Number, required: true }
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  verifiedReportCount: {
    type: Number,
    default: 0
  },
  amenities: [String],
  capacity: Number,
  currentOccupancy: Number,
  monthlyRent: Number,
  contactPhone: String,
  contactEmail: String,
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
accommodationSchema.index({ location: '2dsphere' });
accommodationSchema.index({ area: 1, ssi: -1 });
accommodationSchema.index({ ssi: -1 });
accommodationSchema.index({ ownerId: 1 });
accommodationSchema.index({ city: 1, area: 1 });

export const Accommodation = mongoose.model<IAccommodation>('Accommodation', accommodationSchema);
```

---

## Report Schema

```typescript
// server/src/models/Report.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  accommodationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  category: 'fire_safety' | 'water_quality' | 'structural' | 'electrical' | 'hygiene' | 'security' | 'other';
  severity: number; // 1-10
  title: string;
  description: string;
  images: string[]; // Cloudinary URLs
  status: 'pending' | 'verified' | 'rejected' | 'resolved';
  aiVerification?: {
    mistral: {
      verdict: 'accept' | 'reject' | 'uncertain';
      confidence: number;
      reasoning: string;
    };
    groq: {
      verdict: 'accept' | 'reject' | 'uncertain';
      confidence: number;
      reasoning: string;
    };
    gemini: {
      verdict: 'accept' | 'reject' | 'uncertain';
      confidence: number;
      reasoning: string;
    };
    consensus: 'accept' | 'reject' | 'pending';
    overallConfidence: number;
  };
  ownerResponse?: {
    response: string;
    proofImages: string[];
    respondedAt: Date;
  };
  studentVerification?: {
    isResolved: boolean;
    feedback: string;
    verifiedAt: Date;
  };
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>({
  accommodationId: {
    type: Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['fire_safety', 'water_quality', 'structural', 'electrical', 'hygiene', 'security', 'other'],
    required: true
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  images: [String],
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'resolved'],
    default: 'pending',
    index: true
  },
  aiVerification: {
    mistral: {
      verdict: { type: String, enum: ['accept', 'reject', 'uncertain'] },
      confidence: { type: Number, min: 0, max: 1 },
      reasoning: String
    },
    groq: {
      verdict: { type: String, enum: ['accept', 'reject', 'uncertain'] },
      confidence: { type: Number, min: 0, max: 1 },
      reasoning: String
    },
    gemini: {
      verdict: { type: String, enum: ['accept', 'reject', 'uncertain'] },
      confidence: { type: Number, min: 0, max: 1 },
      reasoning: String
    },
    consensus: {
      type: String,
      enum: ['accept', 'reject', 'pending']
    },
    overallConfidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  ownerResponse: {
    response: String,
    proofImages: [String],
    respondedAt: Date
  },
  studentVerification: {
    isResolved: Boolean,
    feedback: String,
    verifiedAt: Date
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ accommodationId: 1, status: 1 });
reportSchema.index({ userId: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ category: 1 });
reportSchema.index({ 'aiVerification.consensus': 1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
```

---

## VerificationResult Schema

```typescript
// server/src/models/VerificationResult.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationResult extends Document {
  reportId: mongoose.Types.ObjectId;
  model: 'mistral' | 'groq' | 'gemini';
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number;
  reasoning: string;
  processingTime: number; // milliseconds
  inputTokens: number;
  outputTokens: number;
  rawResponse: any;
  createdAt: Date;
}

const verificationResultSchema = new Schema<IVerificationResult>({
  reportId: {
    type: Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    index: true
  },
  model: {
    type: String,
    enum: ['mistral', 'groq', 'gemini'],
    required: true
  },
  verdict: {
    type: String,
    enum: ['accept', 'reject', 'uncertain'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  reasoning: {
    type: String,
    required: true
  },
  processingTime: {
    type: Number,
    required: true
  },
  inputTokens: Number,
  outputTokens: Number,
  rawResponse: Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
verificationResultSchema.index({ reportId: 1, model: 1 });
verificationResultSchema.index({ model: 1, verdict: 1 });
verificationResultSchema.index({ createdAt: -1 });

export const VerificationResult = mongoose.model<IVerificationResult>('VerificationResult', verificationResultSchema);
```

---

## SafetyIndex Schema

```typescript
// server/src/models/SafetyIndex.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISafetyIndex extends Document {
  accommodationId: mongoose.Types.ObjectId;
  ssi: number; // 0-100
  categoryScores: {
    fire_safety: number;
    water_quality: number;
    structural: number;
    electrical: number;
    hygiene: number;
    security: number;
  };
  reportCount: number;
  verifiedReportCount: number;
  lastUpdated: Date;
  calculationMethod: 'simple_average' | 'weighted' | 'ml_based';
  metadata: {
    totalReports: number;
    recentReports: number; // last 30 days
    avgSeverity: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  createdAt: Date;
  updatedAt: Date;
}

const safetyIndexSchema = new Schema<ISafetyIndex>({
  accommodationId: {
    type: Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: true,
    unique: true
  },
  ssi: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  categoryScores: {
    fire_safety: { type: Number, min: 0, max: 100 },
    water_quality: { type: Number, min: 0, max: 100 },
    structural: { type: Number, min: 0, max: 100 },
    electrical: { type: Number, min: 0, max: 100 },
    hygiene: { type: Number, min: 0, max: 100 },
    security: { type: Number, min: 0, max: 100 }
  },
  reportCount: {
    type: Number,
    default: 0
  },
  verifiedReportCount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  calculationMethod: {
    type: String,
    enum: ['simple_average', 'weighted', 'ml_based'],
    default: 'weighted'
  },
  metadata: {
    totalReports: { type: Number, default: 0 },
    recentReports: { type: Number, default: 0 },
    avgSeverity: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }
}, {
  timestamps: true
});

// Indexes
safetyIndexSchema.index({ accommodationId: 1 }, { unique: true });
safetyIndexSchema.index({ ssi: -1 });
safetyIndexSchema.index({ 'metadata.riskLevel': 1 });

export const SafetyIndex = mongoose.model<ISafetyIndex>('SafetyIndex', safetyIndexSchema);
```

---

## SSI Calculation Logic

### Simple Average (Baseline)
```
SSI = 100 - (average_severity * 10)
```

### Weighted Algorithm (Production)
```
Category Weight = 1 / (1 + ln(report_count + 1))
Category Score = 100 - (avg_severity * 10 * weight)
SSI = weighted_average(all_category_scores)
```

### Risk Level Classification
- **Low Risk (Green):** SSI >= 70
- **Medium Risk (Yellow):** 40 <= SSI < 70
- **High Risk (Red):** SSI < 40
- **Critical:** SSI < 20

---

## MongoDB Aggregation Pipelines

### SSI Calculation Pipeline
```javascript
const ssiPipeline = [
  { $match: { accommodationId: ObjectId(id), status: 'verified' } },
  {
    $group: {
      _id: '$category',
      avgSeverity: { $avg: '$severity' },
      reportCount: { $sum: 1 }
    }
  },
  {
    $project: {
      category: '$_id',
      score: {
        $subtract: [
          100,
          { $multiply: ['$avgSeverity', 10, { $ln: { $add: ['$reportCount', 1] } }] }
        ]
      }
    }
  },
  { $group: { _id: null, ssi: { $avg: '$score' } } }
];
```

### Area Risk Analytics Pipeline
```javascript
const areaRiskPipeline = [
  { $group: { _id: '$area', avgSSI: { $avg: '$ssi' }, count: { $sum: 1 } } },
  { $sort: { avgSSI: 1 } }
];
```

### Dashboard Analytics Pipeline
```javascript
const dashboardPipeline = [
  { $match: { createdAt: { $gte: thirtyDaysAgo } } },
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
];
```
