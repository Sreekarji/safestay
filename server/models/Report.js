const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  accommodationName: {
    type: String,
    required: true,
    trim: true
  },
  accommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accommodation',
    default: null
  },
  issueType: {
    type: String,
    required: true,
    enum: ['Food Safety', 'Water Quality', 'Hygiene', 'Security', 'Infrastructure']
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resolved', 'verified', 'disputed'],
    default: 'pending'
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isCountered: {
    type: Boolean,
    default: false
  },
  counterStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', null],
    default: null
  },
  // Resolution by owner
  resolution: {
    description: {
      type: String,
      default: ''
    },
    actionTaken: {
      type: String,
      default: ''
    },
    images: [{
      url: String,
      publicId: String
    }],
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  // Verification by student
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    feedback: {
      type: String,
      default: ''
    },
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputeReason: {
      type: String,
      default: ''
    }
  },
  // ✅ AI Verification Fields
  aiVerification: {
    verdict: {
      type: String,
      enum: ['VERIFIED', 'REJECTED', 'NEEDS_REVIEW', null],
      default: null
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'none', 'unknown', null],
      default: null
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    summary: {
      type: String,
      default: null
    },
    recommendAdminReview: {
      type: Boolean,
      default: false
    },
    details: {
      gemini: {
        type: Object,
        default: null
      },
      groq: {
        type: Object,
        default: null
      },
      mistral: {
        type: Object,
        default: null
      }
    },
    timestamp: {
      type: Date,
      default: null
    }
  }
}, { 
  timestamps: true 
});

// ✅ Indexes for better query performance
reportSchema.index({ user: 1 });
reportSchema.index({ accommodation: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'aiVerification.verdict': 1 });
reportSchema.index({ 'aiVerification.recommendAdminReview': 1 });

module.exports = mongoose.model('Report', reportSchema);