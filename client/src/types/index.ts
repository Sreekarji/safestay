export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'owner' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  severity: Severity;
  status: ReportStatus;
  location: string;
  accommodation: Accommodation;
  images: string[];
  aiVerdict: AIVerdict[];
  ssiImpact: SSIImpact;
  reporter: User;
  createdAt: string;
  updatedAt: string;
}

export type ReportCategory = 'harassment' | 'theft' | 'unsafe_area' | 'infrastructure' | 'health_hazard' | 'other';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'pending' | 'verified' | 'resolved' | 'rejected';

export interface Accommodation {
  id: string;
  name: string;
  area: string;
  address: string;
  ssi: number;
  totalReports: number;
  verifiedReports: number;
  coordinates: { lat: number; lng: number };
}

export interface AIVerdict {
  model: string;
  verdict: 'authentic' | 'suspicious' | 'fake';
  confidence: number;
  analysis: string;
  audioUrl?: string;
}

export interface SSIImpact {
  before: number;
  after: number;
}

export interface MapMarker {
  id: string;
  name: string;
  area: string;
  coordinates: { lat: number; lng: number };
  ssi: number;
  reportCount: number;
  accommodation: string;
}

export interface DashboardStats {
  totalReports: number;
  pending: number;
  verified: number;
  resolved: number;
  weeklyTrend: number;
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
  confirmPassword: string;
  role: 'student' | 'owner';
  terms: boolean;
}

export interface OTPData {
  otp: string;
  email: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  category?: ReportCategory;
  severity?: Severity;
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
  lat: number;
  lng: number;
  type: 'accommodation' | 'college';
}

export interface RoutePoint {
  lat: number;
  lng: number;
  ssi: number;
}

export interface RiskHotspot {
  lat: number;
  lng: number;
  severity: number;
  description: string;
}

export interface RouteIntelligence {
  id: string;
  name: string;
  points: RoutePoint[];
  score: number;
  distance: number;
  duration: number;
  nightSafety: number;
  hotspots: RiskHotspot[];
}

export interface RouteComparison {
  routeA: RouteIntelligence;
  routeB: RouteIntelligence;
  recommendation: string;
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
