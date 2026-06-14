// ── User ──────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'owner' | 'admin';
  college?: string;
  collegeName?: string;
  studentId?: string;
  isVerified?: boolean;
  isCollegeVerified?: boolean;
  isBanned?: boolean;
  profilePhoto?: string;
  notificationPrefs?: Record<string, boolean>;
  ownerVerification?: {
    status: 'none' | 'pending' | 'under_review' | 'verified' | 'rejected';
    rejectionReason?: string;
    verifiedAt?: string;
  };
  ownerVerificationStatus?: 'pending' | 'under_review' | 'verified' | 'rejected';
  propertyName?: string;
  propertyCount?: string;
  createdAt?: string;
}

// ── Report ────────────────────────────────────────────────────
export type ReportCategory =
  | 'theft'
  | 'harassment'
  | 'fire_safety'
  | 'hygiene'
  | 'electricity'
  | 'electrical'
  | 'water'
  | 'water_quality'
  | 'structural'
  | 'security'
  | 'noise'
  | 'infrastructure'
  | 'food_safety'
  | 'other';

export type ReportStatus = 'pending' | 'verified' | 'disputed' | 'resolved' | 'ai_verified' | 'approved' | 'rejected' | 'review';

export interface Report {
  _id: string;
  title: string;
  description: string;
  category: ReportCategory;
  severity: number;
  status: ReportStatus;
  accommodationId: Accommodation | string;
  userId: User | string;
  images: string[];
  aiVerification?: {
    mistral?: AIVerdictResult;
    groq?: AIVerdictResult;
    gemini?: AIVerdictResult;
    consensus?: 'accept' | 'reject' | 'pending';
    overallConfidence?: number;
    dispositionReason?: string;
    verifiedAt?: string;
  };
  ownerResponse?: {
    response: string;
    proofImages: string[];
    respondedAt: string;
  };
  resolution?: {
    description: string;
    actionTaken: string;
    images: string[];
    resolvedBy: string;
    resolvedAt: string;
  };
  studentVerification?: {
    isResolved: boolean;
    feedback?: string;
    verifiedAt: string;
  };
  counterReport?: {
    reason: string;
    description: string;
    evidence: string[];
    status: 'pending' | 'accepted' | 'rejected';
  };
  upvotes: number;
  upvotesBy: string[];
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIVerdictResult {
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number;
  reasoning: string;
}

// ── Accommodation ─────────────────────────────────────────────
export interface Accommodation {
  _id: string;
  name: string;
  type: 'pg' | 'hostel' | 'apartment' | 'other';
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  ssi: number;
  trustScore?: number;
  trustScoreLabel?: string;
  trustScoreColor?: string;
  riskScore?: number;
  totalReports: number;
  verifiedReports: number;
  ownerName?: string;
  ownerContact?: string;
  ownerId?: string | User;
  owner?: string | User;
  contactPhone?: string;
  contactEmail?: string;
  images: string[];
  description?: string;
  monthlyRent?: number;
  pricePerMonth?: number;
  amenities?: string[];
  capacity?: number;
  totalRooms?: number;
  currentOccupancy?: number;
  occupiedRooms?: number;
  reportCount?: number;
  categoryScores?: Record<string, number>;
  isVerified?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    coordinates?: number[];
  };
  createdAt: string;
  updatedAt: string;
}

// ── Map Marker ────────────────────────────────────────────────
export interface MapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  ssi: number;
  area: string;
  type: 'pg' | 'hostel' | 'apartment';
  totalReports: number;
}

// ── Historical SSI ────────────────────────────────────────────
export interface SSIMonthly {
  month: string;
  score: number;
}

export interface MapMarkerWithHistory extends MapMarker {
  history: SSIMonthly[];
  currentSSI?: number;
}

// ── Dashboard Analytics ───────────────────────────────────────
export interface DashboardStats {
  totalAccommodations?: number;
  totalReports?: number;
  verifiedReports?: number;
  averageSSI?: number;
  highRiskCount?: number;
  mediumRiskCount?: number;
  lowRiskCount?: number;
  pending?: number;
  resolved?: number;
  verified?: number;
}

export interface SSITrend {
  date: string;
  averageSSI: number;
  reportsCount: number;
}

export interface AreaRisk {
  area: string;
  averageSSI: number;
  reportCount: number;
  accommodations: number;
}

export type CategoryBreakdown = {
  category: ReportCategory;
  count: number;
  percentage: number;
}

export interface RecentReport {
  id: string;
  accommodationName: string;
  area: string;
  category: ReportCategory;
  severity: number;
  status: ReportStatus;
  date: string;
}

export interface AISummary {
  accommodationId: string;
  summary: string;
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'safe' | 'moderate' | 'high-risk';
}

// ── Timeline ──────────────────────────────────────────────────
export const TIMELINE_MONTHS = [
  '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
];

export function formatMonth(month: string): string {
  const [y, m] = month.split('-');
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getMonthIndex(month: string): number {
  return TIMELINE_MONTHS.indexOf(month);
}

// ── SSI Helpers ───────────────────────────────────────────────
export type SSILevel = 'high' | 'medium' | 'low';

export function getSSILevel(ssi: number): SSILevel {
  if (ssi >= 70) return 'high';
  if (ssi >= 40) return 'medium';
  return 'low';
}

export function getSSIColor(ssi: number): string {
  if (ssi >= 70) return '#22c55e';
  if (ssi >= 40) return '#f59e0b';
  return '#ef4444';
}

export function getSSILabel(ssi: number): string {
  if (ssi >= 70) return 'Safe';
  if (ssi >= 40) return 'Moderate';
  return 'Risky';
}

export function getSSITrend(current: number, previous: number): { arrow: string; label: string; color: string } {
  const diff = current - previous;
  if (diff > 3) return { arrow: '↑', label: 'Improving', color: '#22c55e' };
  if (diff < -3) return { arrow: '↓', label: 'Declining', color: '#ef4444' };
  return { arrow: '→', label: 'Stable', color: '#f59e0b' };
}

// ── Route Intelligence ────────────────────────────────────────
export interface RouteLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  area: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  safetyScore: number;
}

export interface RiskHotspot {
  id: string;
  latitude: number;
  longitude: number;
  type: ReportCategory;
  label: string;
  reportCount: number;
  severity: 1 | 2 | 3 | 4 | 5;
  lastReported: string;
}

export interface RouteIntelligence {
  routeId: string;
  accommodationName: string;
  collegeName: string;
  routePoints: RoutePoint[];
  hotspots: RiskHotspot[];
  safetyScore: number;
  riskLevel: 'safe' | 'moderate' | 'high-risk';
  travelTime: string;
  distance: string;
  nightSafetyRating: number;
  recommendation: string;
  aiSummary: string;
}

export interface RouteComparison {
  routeA: RouteIntelligence;
  routeB: RouteIntelligence;
  aiRecommendation: string;
}

// ── Category Labels & Icons ──────────────────────────────────
export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  theft: 'Theft',
  harassment: 'Harassment',
  fire_safety: 'Fire Safety',
  hygiene: 'Hygiene',
  electricity: 'Electricity',
  electrical: 'Electrical',
  water: 'Water Supply',
  water_quality: 'Water Quality',
  structural: 'Structural',
  security: 'Security',
  noise: 'Noise',
  infrastructure: 'Infrastructure',
  food_safety: 'Food Safety',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<ReportCategory, string> = {
  theft: '🔓',
  harassment: '⚠️',
  fire_safety: '🔥',
  hygiene: '🧹',
  electricity: '⚡',
  electrical: '⚡',
  water: '💧',
  water_quality: '💧',
  structural: '🏗️',
  security: '🛡️',
  noise: '🔊',
  infrastructure: '🏗️',
  food_safety: '🍽️',
  other: '📋',
};

// ── Auth types ───────────────────────────────────────────────
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
  role?: 'student' | 'owner';
  college?: string;
  studentId?: string;
  propertyName?: string;
  propertiesManaged?: string;
}

export interface OTPData {
  otp: string;
  email: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  category?: ReportCategory;
  severity?: number;
  status?: ReportStatus;
  search?: string;
}

// ── AI Verdict (component-facing) ────────────────────────────
export interface AIVerdict {
  model: string;
  verdict: 'authentic' | 'suspicious' | 'fake';
  confidence: number;
  analysis: string;
  audioUrl?: string;
}
