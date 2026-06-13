export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'owner' | 'admin';
  college?: string;
  studentId?: string;
  isVerified?: boolean;
  isBanned?: boolean;
  profilePhoto?: string;
  ownerVerification?: {
    status: 'none' | 'pending' | 'under_review' | 'verified' | 'rejected';
    rejectionReason?: string;
    verifiedAt?: string;
  };
  createdAt?: string;
}

export interface Report {
  _id: string;
  title: string;
  description: string;
  category: ReportCategory;
  severity: number; // 1-10 numeric
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
    verifiedAt?: string;
  };
  ownerResponse?: {
    message: string;
    proofImages: string[];
    respondedAt: string;
  };
  studentVerification?: {
    verified: boolean;
    comment?: string;
    verifiedAt: string;
  };
  counterReport?: {
    reason: string;
    description: string;
    evidence: string[];
    status: 'pending' | 'accepted' | 'rejected';
  };
  upvotes: number;
  upvotedBy: string[];
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

// Component-facing AI verdict (used by AIVerdict.tsx)
export interface AIVerdict {
  model: string;
  verdict: 'authentic' | 'suspicious' | 'fake';
  confidence: number;
  analysis: string;
  audioUrl?: string;
}

// Backend AI verification result
export interface AIVerdictResult {
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number; // 0-1
  reasoning: string;
}

export type ReportCategory = 'fire_safety' | 'water_quality' | 'structural' | 'electrical' | 'hygiene' | 'security' | 'food_safety' | 'other';
export type ReportStatus = 'pending' | 'ai_verified' | 'approved' | 'resolved' | 'verified' | 'disputed' | 'rejected';

export interface Accommodation {
  _id: string;
  name: string;
  type?: string;
  address: string;
  area: string;
  city?: string;
  state?: string;
  pincode?: string;
  ssi: number;
  ssiHistory?: { score: number; date: string; reportCount: number }[];
  categoryScores?: Record<string, number>;
  reportCount: number;
  verifiedReportCount?: number;
  amenities?: string[];
  capacity?: number;
  currentOccupancy?: number;
  monthlyRent?: number;
  contactPhone?: string;
  contactEmail?: string;
  images?: string[];
  ownerId?: string;
  isActive?: boolean;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  riskLevel?: string;
}

export interface MapMarker {
  id: string;
  name: string;
  area: string;
  coordinates: { lat: number; lng: number };
  ssi: number;
  reportCount: number;
  accommodation: string;
  riskLevel?: string;
}

export interface DashboardStats {
  totalReports: number;
  pending: number;
  verified: number;
  resolved: number;
  weeklyTrend?: number;
}

export interface Language {
  code: 'en' | 'te' | 'hi';
  name: string;
  flag: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  role?: 'student' | 'owner';
  college?: string;
  studentId?: string;
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

// Map & Route types
export type SSILevel = 'high' | 'medium' | 'low';

export interface SSIMonthly {
  month: string;
  score: number;
}

export interface MapMarkerWithHistory extends MapMarker {
  history: SSIMonthly[];
  currentSSI?: number;
}

export interface RouteLocation {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  latitude: number;
  longitude: number;
  area: string;
  type?: 'accommodation' | 'college';
}

export interface RoutePoint {
  lat: number;
  lng: number;
  ssi?: number;
  safetyScore?: number;
}

export interface RiskHotspot {
  id?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  severity: number;
  description?: string;
  label?: string;
  type?: string;
  reportCount?: number;
  lastReported?: string;
}

export interface RouteIntelligence {
  id?: string;
  routeId?: string;
  name?: string;
  points?: RoutePoint[];
  score?: number;
  distance: string;
  duration?: number;
  nightSafety?: number;
  hotspots: RiskHotspot[];
  accommodationName: string;
  collegeName: string;
  safetyScore: number;
  riskLevel: string;
  travelTime: string;
  nightSafetyRating: number;
  recommendation?: string;
  aiSummary?: string;
  routePoints: RoutePoint[];
}

export interface RouteComparison {
  routeA: RouteIntelligence;
  routeB: RouteIntelligence;
  recommendation?: string;
  aiRecommendation: string;
}

export interface AISummary {
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'safe' | 'moderate' | 'high-risk';
  summary: string;
  recommendation: string;
}

export const TIMELINE_MONTHS = [
  '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
];

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

export function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${year}`;
}

export function getMonthIndex(month: string): number {
  return TIMELINE_MONTHS.indexOf(month);
}
