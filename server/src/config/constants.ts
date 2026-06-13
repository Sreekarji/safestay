// ========================
// Report Categories
// ========================
export const REPORT_CATEGORIES = [
  'fire_safety',
  'water_quality',
  'structural',
  'electrical',
  'hygiene',
  'security',
  'food_safety',
  'other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  fire_safety: 'Fire Safety',
  water_quality: 'Water Quality',
  structural: 'Structural Safety',
  electrical: 'Electrical Safety',
  hygiene: 'Hygiene',
  security: 'Security',
  food_safety: 'Food Safety',
  other: 'Other Safety Issue',
};

// ========================
// Report Statuses
// ========================
export const REPORT_STATUSES = [
  'pending',
  'ai_verified',
  'approved',
  'resolved',
  'verified',
  'disputed',
  'rejected',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

// Statuses that count as "active" for SSI calculation
export const ACTIVE_REPORT_STATUSES: ReportStatus[] = [
  'pending',
  'ai_verified',
  'approved',
  'resolved',
  'verified',
  'disputed',
];

// Statuses that indicate resolution
export const RESOLVED_STATUSES: ReportStatus[] = ['resolved', 'verified'];

// ========================
// User Roles
// ========================
export const USER_ROLES = ['student', 'owner', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ========================
// Accommodation Types
// ========================
export const ACCOMMODATION_TYPES = ['pg', 'hostel', 'apartment'] as const;
export type AccommodationType = (typeof ACCOMMODATION_TYPES)[number];

// ========================
// Owner Verification Statuses
// ========================
export const OWNER_VERIFICATION_STATUSES = [
  'none',
  'pending',
  'under_review',
  'verified',
  'rejected',
] as const;
export type OwnerVerificationStatus = (typeof OWNER_VERIFICATION_STATUSES)[number];

// ========================
// SSI Thresholds
// ========================
export const SSI_THRESHOLDS = {
  LOW_RISK: 80,
  MEDIUM_RISK: 50,
  HIGH_RISK: 20,
} as const;

// ========================
// Pagination Defaults
// ========================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ========================
// Upload Limits
// ========================
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
} as const;

// ========================
// Rate Limiting
// ========================
export const RATE_LIMITS = {
  API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_MAX: 100,
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX: 20,
  REPORT_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  REPORT_MAX: 50,
  UPLOAD_WINDOW_MS: 60 * 60 * 1000,
  UPLOAD_MAX: 20,
} as const;

// ========================
// OTP
// ========================
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
} as const;

// ========================
// JWT
// ========================
export const JWT_CONFIG = {
  EXPIRES_IN: '7d',
} as const;

// ========================
// Severity
// ========================
export const SEVERITY = {
  MIN: 1,
  MAX: 10,
} as const;

// ========================
// Cloudinary Folders
// ========================
export const CLOUDINARY_FOLDERS = {
  REPORTS: 'safestay/reports',
  OWNER_DOCUMENTS: 'safestay/owner-documents',
  RESOLUTIONS: 'safestay/resolutions',
  PROFILE_PHOTOS: 'safestay/profile-photos',
} as const;
