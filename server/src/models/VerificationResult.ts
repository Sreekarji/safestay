import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationResult extends Document {
  reportId: mongoose.Types.ObjectId;
  model: 'mistral' | 'groq' | 'gemini';
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number;
  reasoning: string;
  processingTime: number; // milliseconds
  inputTokens?: number;
  outputTokens?: number;
  rawResponse?: any;

  createdAt: Date;
}

const verificationResultSchema = new Schema<IVerificationResult>({
  reportId: {
    type: Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    index: true,
  },
  model: {
    type: String,
    enum: ['mistral', 'groq', 'gemini'],
    required: true,
  },
  verdict: {
    type: String,
    enum: ['accept', 'reject', 'uncertain'],
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  reasoning: {
    type: String,
    required: true,
  },
  processingTime: {
    type: Number,
    required: true,
  },
  inputTokens: Number,
  outputTokens: Number,
  rawResponse: Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Indexes
verificationResultSchema.index({ reportId: 1, model: 1 });
verificationResultSchema.index({ model: 1, verdict: 1 });
verificationResultSchema.index({ createdAt: -1 });

export const VerificationResult = mongoose.model<IVerificationResult>('VerificationResult', verificationResultSchema);
