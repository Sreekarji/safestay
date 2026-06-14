import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'student' | 'owner' | 'admin';
  college?: string;
  collegeName?: string;
  studentId?: string;
  isVerified: boolean;
  isCollegeVerified: boolean;
  isBanned: boolean;
  profilePhoto?: string;
  notificationPrefs?: Record<string, boolean>;

  // Owner verification fields
  ownerVerification: {
    status: 'none' | 'pending' | 'under_review' | 'verified' | 'rejected';
    documents: {
      governmentId?: string;   // Cloudinary URL
      propertyProof?: string;  // Cloudinary URL
      businessRegistration?: string; // Cloudinary URL
    };
    rejectionReason?: string;
    verifiedAt?: Date;
  };

  // OTP fields
  otp?: string;
  otpExpiry?: Date;
  forgotPasswordOtp?: string;
  forgotPasswordOtpExpiry?: Date;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't return password by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'],
  },
  role: {
    type: String,
    enum: ['student', 'owner', 'admin'],
    default: 'student',
  },
  college: {
    type: String,
    trim: true,
  },
  collegeName: {
    type: String,
    trim: true,
  },
  studentId: {
    type: String,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isCollegeVerified: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  profilePhoto: {
    type: String, // Cloudinary URL
  },
  notificationPrefs: {
    type: Schema.Types.Mixed,
    default: {},
  },

  // Owner verification
  ownerVerification: {
    status: {
      type: String,
      enum: ['none', 'pending', 'under_review', 'verified', 'rejected'],
      default: 'none',
    },
    documents: {
      governmentId: String,
      propertyProof: String,
      businessRegistration: String,
    },
    rejectionReason: String,
    verifiedAt: Date,
  },

  // OTP
  otp: String,
  otpExpiry: Date,
  forgotPasswordOtp: String,
  forgotPasswordOtpExpiry: Date,
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ college: 1 });
userSchema.index({ collegeName: 1 });
userSchema.index({ isBanned: 1 });
userSchema.index({ isCollegeVerified: 1 });
userSchema.index({ 'ownerVerification.status': 1 });

export const User = mongoose.model<IUser>('User', userSchema);
