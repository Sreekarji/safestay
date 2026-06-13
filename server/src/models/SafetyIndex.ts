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
    unique: true,
  },
  ssi: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  categoryScores: {
    fire_safety: { type: Number, default: 50, min: 0, max: 100 },
    water_quality: { type: Number, default: 50, min: 0, max: 100 },
    structural: { type: Number, default: 50, min: 0, max: 100 },
    electrical: { type: Number, default: 50, min: 0, max: 100 },
    hygiene: { type: Number, default: 50, min: 0, max: 100 },
    security: { type: Number, default: 50, min: 0, max: 100 },
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  verifiedReportCount: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  calculationMethod: {
    type: String,
    enum: ['simple_average', 'weighted', 'ml_based'],
    default: 'weighted',
  },
  metadata: {
    totalReports: { type: Number, default: 0 },
    recentReports: { type: Number, default: 0 },
    avgSeverity: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
  },
}, {
  timestamps: true,
});

// Indexes
safetyIndexSchema.index({ accommodationId: 1 }, { unique: true });
safetyIndexSchema.index({ ssi: -1 });
safetyIndexSchema.index({ 'metadata.riskLevel': 1 });

export const SafetyIndex = mongoose.model<ISafetyIndex>('SafetyIndex', safetyIndexSchema);
