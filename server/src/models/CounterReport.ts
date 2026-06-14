import mongoose, { Schema, Document } from 'mongoose';

export interface ICounterReport extends Document {
  originalReport: mongoose.Types.ObjectId;
  accommodation: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  reason: string;
  explanation: string;
  evidenceUrls: string[];
  evidenceDescription?: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const counterReportSchema = new Schema<ICounterReport>({
  originalReport: {
    type: Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    index: true,
  },
  accommodation: {
    type: Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required'],
    maxlength: [2000, 'Explanation cannot exceed 2000 characters'],
  },
  evidenceUrls: [{
    type: String,
  }],
  evidenceDescription: {
    type: String,
    maxlength: [1000, 'Evidence description cannot exceed 1000 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  reviewNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
counterReportSchema.index({ originalReport: 1 }, { unique: true });
counterReportSchema.index({ accommodation: 1 });
counterReportSchema.index({ owner: 1 });
counterReportSchema.index({ status: 1 });

export const CounterReport = mongoose.model<ICounterReport>('CounterReport', counterReportSchema);
