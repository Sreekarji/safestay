// ── Accommodation ────────────────────────────────────────────
export interface Accommodation {
  _id: string;
  name: string;
  type: 'pg' | 'hostel' | 'apartment';
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  ssi: number;
  totalReports: number;
  verifiedReports: number;
  ownerName?: string;
  ownerContact?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Safety Report ────────────────────────────────────────────
export type ReportCategory =
  | 'theft'
  | 'harassment'
  | 'fire_safety'
  | 'hygiene'
  | 'electricity'
  | 'water'
  | 'security'
  | 'noise'
  | 'other';

export type ReportStatus = 'pending' | 'verified' | 'disputed' | 'resolved';

export interface SafetyReport {
  _id: string;
  accommodationId: string;
  userId: string;
  userName: string;
  category: ReportCategory;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  images: string[];
  status: ReportStatus;
  aiVerdict?: string;
  aiConfidence?: number;
  language: 'en' | 'te' | 'hi';
  createdAt: string;
}

// ── Map Marker ───────────────────────────────────────────────
export interface MapMarker {
  accommodationId: string;
  name: string;
  latitude: number;
  longitude: number;
  ssi: number;
  area: string;
  totalReports: number;
  type: 'pg' | 'hostel' | 'apartment';
}

// ── Historical SSI ───────────────────────────────────────────
export interface SSIMonthly {
  month: string;   // "2025-01" format
  score: number;
}

export interface MapMarkerWithHistory extends MapMarker {
  history: SSIMonthly[];
}

export interface AISummary {
  accommodationId: string;
  summary: string;
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'safe' | 'moderate' | 'high-risk';
}

// ── Timeline ─────────────────────────────────────────────────
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

// ── Dashboard Analytics ──────────────────────────────────────
export interface DashboardStats {
  totalAccommodations: number;
  totalReports: number;
  verifiedReports: number;
  averageSSI: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
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

export interface CategoryBreakdown {
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

// ── SSI Helpers ──────────────────────────────────────────────
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

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  theft: 'Theft',
  harassment: 'Harassment',
  fire_safety: 'Fire Safety',
  hygiene: 'Hygiene',
  electricity: 'Electricity',
  water: 'Water Supply',
  security: 'Security',
  noise: 'Noise',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<ReportCategory, string> = {
  theft: '🔓',
  harassment: '⚠️',
  fire_safety: '🔥',
  hygiene: '🧹',
  electricity: '⚡',
  water: '💧',
  security: '🛡️',
  noise: '🔊',
  other: '📋',
};

// ── Route Intelligence ─────────────────────────────────────
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
  safetyScore: number; // 0-100
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
