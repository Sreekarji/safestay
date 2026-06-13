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
