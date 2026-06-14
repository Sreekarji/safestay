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
  latitude?: number;
  longitude?: number;
  ownerId: mongoose.Types.ObjectId;
  owner?: mongoose.Types.ObjectId;

  // SSI (SafeStay Safety Index)
  ssi: number;
  ssiHistory: Array<{
    score: number;
    date: Date;
    reportCount: number;
  }>;
  categoryScores: {
    fire_safety: number;
    water_quality: number;
    structural: number;
    electrical: number;
    hygiene: number;
    security: number;
  };

  // Trust Score (reference compatibility)
  trustScore: number;
  trustScoreLabel: string;
  trustScoreColor: string;
  riskScore: number;

  // Report counts
  reportCount: number;
  verifiedReportCount: number;
  totalReports: number;

  // Property details
  description?: string;
  amenities: string[];
  capacity: number;
  totalRooms?: number;
  currentOccupancy: number;
  occupiedRooms?: number;
  monthlyRent: number;
  pricePerMonth?: number;
  contactPhone: string;
  contactEmail: string;
  images: string[]; // Cloudinary URLs

  // Status
  isActive: boolean;
  isVerified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const accommodationSchema = new Schema<IAccommodation>({
  name: {
    type: String,
    required: [true, 'Accommodation name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters'],
  },
  type: {
    type: String,
    enum: ['pg', 'hostel', 'apartment'],
    required: [true, 'Accommodation type is required'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true,
    index: true,
  },
  city: {
    type: String,
    required: true,
    default: 'Hyderabad',
  },
  state: {
    type: String,
    required: true,
    default: 'Telangana',
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  // SSI
  ssi: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  ssiHistory: [{
    score: { type: Number, required: true },
    date: { type: Date, required: true },
    reportCount: { type: Number, required: true },
  }],
  categoryScores: {
    fire_safety: { type: Number, default: 50, min: 0, max: 100 },
    water_quality: { type: Number, default: 50, min: 0, max: 100 },
    structural: { type: Number, default: 50, min: 0, max: 100 },
    electrical: { type: Number, default: 50, min: 0, max: 100 },
    hygiene: { type: Number, default: 50, min: 0, max: 100 },
    security: { type: Number, default: 50, min: 0, max: 100 },
  },

  // Trust Score
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  trustScoreLabel: {
    type: String,
    default: 'Moderate',
  },
  trustScoreColor: {
    type: String,
    default: '#f5a623',
  },
  riskScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },

  // Report counts
  reportCount: {
    type: Number,
    default: 0,
  },
  verifiedReportCount: {
    type: Number,
    default: 0,
  },
  totalReports: {
    type: Number,
    default: 0,
  },

  // Property details
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  amenities: [String],
  capacity: {
    type: Number,
    min: 1,
  },
  totalRooms: {
    type: Number,
    min: 0,
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0,
  },
  occupiedRooms: {
    type: Number,
    default: 0,
    min: 0,
  },
  monthlyRent: {
    type: Number,
    min: 0,
  },
  pricePerMonth: {
    type: Number,
    min: 0,
  },
  contactPhone: String,
  contactEmail: String,
  images: [String],

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for performance
accommodationSchema.index({ location: '2dsphere' });
accommodationSchema.index({ area: 1, ssi: -1 });
accommodationSchema.index({ ssi: -1 });
accommodationSchema.index({ ownerId: 1 });
accommodationSchema.index({ owner: 1 });
accommodationSchema.index({ city: 1, area: 1 });
accommodationSchema.index({ type: 1 });
accommodationSchema.index({ isActive: 1 });
accommodationSchema.index({ trustScore: 1 });

export const Accommodation = mongoose.model<IAccommodation>('Accommodation', accommodationSchema);
