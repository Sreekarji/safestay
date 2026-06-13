import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  accommodationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Report details
  category: 'fire_safety' | 'water_quality' | 'structural' | 'electrical' | 'hygiene' | 'security' | 'food_safety' | 'other';
  severity: number; // 1-10
  title: string;
  description: string;
  images: string[]; // Cloudinary URLs

  // Status (7 states)
  status: 'pending' | 'ai_verified' | 'approved' | 'resolved' | 'verified' | 'disputed' | 'rejected';

  // AI Verification (3 models)
  aiVerification: {
    mistral?: {
      verdict: 'accept' | 'reject' | 'uncertain';
      confidence: number;
      reasoning: string;
    };
    groq?: {
      verdict: 'accept' | 'reject' | 'uncertain';
      confidence: number;
      reasoning: string;
    };
    gemini?: {
      verdict: 'accept' | 'reject' | 'uncertain';
      confidence: number;
      reasoning: string;
    };
    consensus: 'accept' | 'reject' | 'pending';
    overallConfidence: number;
    verifiedAt?: Date;
  };

  // Owner resolution
  ownerResponse?: {
    response: string;
    proofImages: string[];
    respondedAt: Date;
  };

  // Student verification of resolution
  studentVerification?: {
    isResolved: boolean;
    feedback: string;
    verifiedAt: Date;
  };

  // Counter-report (owner dispute)
  counterReport?: {
    reason: 'false_information' | 'outdated_issue' | 'mistaken_identity' | 'resolved_issue' | 'malicious_intent' | 'other';
    description: string;
    evidence: string[];
    submittedAt: Date;
    status: 'pending' | 'accepted' | 'rejected';
  };

  // Engagement
  isAnonymous: boolean;
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>({
  accommodationId: {
    type: Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Report details
  category: {
    type: String,
    enum: ['fire_safety', 'water_quality', 'structural', 'electrical', 'hygiene', 'security', 'food_safety', 'other'],
    required: [true, 'Category is required'],
  },
  severity: {
    type: Number,
    required: [true, 'Severity is required'],
    min: 1,
    max: 10,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  images: [String],

  // Status
  status: {
    type: String,
    enum: ['pending', 'ai_verified', 'approved', 'resolved', 'verified', 'disputed', 'rejected'],
    default: 'pending',
  },

  // AI Verification
  aiVerification: {
    mistral: {
      verdict: { type: String, enum: ['accept', 'reject', 'uncertain'] },
      confidence: { type: Number, min: 0, max: 1 },
      reasoning: String,
    },
    groq: {
      verdict: { type: String, enum: ['accept', 'reject', 'uncertain'] },
      confidence: { type: Number, min: 0, max: 1 },
      reasoning: String,
    },
    gemini: {
      verdict: { type: String, enum: ['accept', 'reject', 'uncertain'] },
      confidence: { type: Number, min: 0, max: 1 },
      reasoning: String,
    },
    consensus: {
      type: String,
      enum: ['accept', 'reject', 'pending'],
      default: 'pending',
    },
    overallConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    verifiedAt: Date,
  },

  // Owner resolution
  ownerResponse: {
    response: String,
    proofImages: [String],
    respondedAt: Date,
  },

  // Student verification
  studentVerification: {
    isResolved: Boolean,
    feedback: String,
    verifiedAt: Date,
  },

  // Counter-report
  counterReport: {
    reason: {
      type: String,
      enum: ['false_information', 'outdated_issue', 'mistaken_identity', 'resolved_issue', 'malicious_intent', 'other'],
    },
    description: String,
    evidence: [String],
    submittedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },

  // Engagement
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  upvotedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Indexes
reportSchema.index({ accommodationId: 1, status: 1 });
reportSchema.index({ userId: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ category: 1 });
reportSchema.index({ 'aiVerification.consensus': 1 });
reportSchema.index({ status: 1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
