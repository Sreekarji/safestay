import axios from 'axios';
import type {
  Accommodation,
  MapMarkerWithHistory,
  DashboardStats,
  SSITrend,
  AreaRisk,
  CategoryBreakdown,
  RecentReport,
  AISummary,
  SSIMonthly,
} from '../types';
import { TIMELINE_MONTHS } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('safestay_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Historical SSI Data Generator ────────────────────────────
function generateHistory(
  startScore: number,
  trend: 'up' | 'down' | 'stable' | 'volatile',
): SSIMonthly[] {
  return TIMELINE_MONTHS.map((month, i) => {
    let score = startScore;
    const progress = i / (TIMELINE_MONTHS.length - 1);
    switch (trend) {
      case 'up':
        score = startScore + Math.round(progress * (95 - startScore) * 0.6) + Math.round(Math.sin(i * 0.8) * 4);
        break;
      case 'down':
        score = startScore - Math.round(progress * (startScore - 10) * 0.7) + Math.round(Math.sin(i * 0.6) * 5);
        break;
      case 'stable':
        score = startScore + Math.round(Math.sin(i * 0.5) * 6) + Math.round(Math.cos(i * 0.3) * 3);
        break;
      case 'volatile':
        score = startScore + Math.round(Math.sin(i * 1.2) * 18) + Math.round(Math.cos(i * 0.7) * 10);
        break;
    }
    return { month, score: Math.max(5, Math.min(98, score)) };
  });
}

// ── Demo Markers with History ────────────────────────────────
const DEMO_MARKERS: MapMarkerWithHistory[] = [
  // ── SAFE ──
  {
    accommodationId: 'demo-1', name: 'Sunshine Ladies PG', latitude: 17.4486, longitude: 78.3908,
    ssi: 92, area: 'Madhapur', totalReports: 2, type: 'pg',
    history: generateHistory(78, 'up'),
  },
  {
    accommodationId: 'demo-2', name: 'Vertex Student Hostel', latitude: 17.4435, longitude: 78.3476,
    ssi: 87, area: 'Hitech City', totalReports: 4, type: 'hostel',
    history: generateHistory(82, 'stable'),
  },
  {
    accommodationId: 'demo-3', name: 'Green Valley Residency', latitude: 17.4400, longitude: 78.3488,
    ssi: 78, area: 'Hitech City', totalReports: 6, type: 'pg',
    history: generateHistory(85, 'down'),
  },
  {
    accommodationId: 'demo-4', name: 'SafeNest Boys PG', latitude: 17.4977, longitude: 78.3171,
    ssi: 84, area: 'Kondapur', totalReports: 3, type: 'pg',
    history: generateHistory(70, 'up'),
  },
  {
    accommodationId: 'demo-5', name: 'Rainbow Ladies Hostel', latitude: 17.4590, longitude: 78.3780,
    ssi: 95, area: 'Gachibowli', totalReports: 1, type: 'hostel',
    history: generateHistory(88, 'up'),
  },

  // ── MODERATE ──
  {
    accommodationId: 'demo-6', name: 'City Nest PG', latitude: 17.4155, longitude: 78.3249,
    ssi: 62, area: 'Ameerpet', totalReports: 12, type: 'pg',
    history: generateHistory(72, 'down'),
  },
  {
    accommodationId: 'demo-7', name: 'Comfort Stay Hostel', latitude: 17.4849, longitude: 78.3013,
    ssi: 55, area: 'Kukatpally', totalReports: 18, type: 'hostel',
    history: generateHistory(68, 'down'),
  },
  {
    accommodationId: 'demo-8', name: 'Student Inn', latitude: 17.4250, longitude: 78.3180,
    ssi: 48, area: 'Ameerpet', totalReports: 22, type: 'pg',
    history: generateHistory(58, 'volatile'),
  },
  {
    accommodationId: 'demo-9', name: 'Metro Homes PG', latitude: 17.4062, longitude: 78.4691,
    ssi: 66, area: 'LB Nagar', totalReports: 10, type: 'pg',
    history: generateHistory(60, 'up'),
  },
  {
    accommodationId: 'demo-10', name: 'Star View Residency', latitude: 17.4744, longitude: 78.3170,
    ssi: 43, area: 'Kondapur', totalReports: 25, type: 'hostel',
    history: generateHistory(70, 'down'),
  },

  // ── RISKY ──
  {
    accommodationId: 'demo-11', name: 'Budget Stay PG', latitude: 17.3967, longitude: 78.4863,
    ssi: 32, area: 'Dilshuknagar', totalReports: 30, type: 'pg',
    history: generateHistory(55, 'down'),
  },
  {
    accommodationId: 'demo-12', name: 'Lakshmi Ladies Hostel', latitude: 17.3833, longitude: 78.4011,
    ssi: 18, area: 'Dilshuknagar', totalReports: 35, type: 'hostel',
    history: generateHistory(45, 'down'),
  },
  {
    accommodationId: 'demo-13', name: 'New York Residency', latitude: 17.4531, longitude: 78.2987,
    ssi: 27, area: 'Kukatpally', totalReports: 28, type: 'pg',
    history: generateHistory(50, 'volatile'),
  },
  {
    accommodationId: 'demo-14', name: 'Sri Sai Student Lodge', latitude: 17.3798, longitude: 78.4783,
    ssi: 12, area: 'LB Nagar', totalReports: 42, type: 'pg',
    history: generateHistory(40, 'down'),
  },
  {
    accommodationId: 'demo-15', name: 'RK Nagar PG', latitude: 17.4689, longitude: 78.3102,
    ssi: 35, area: 'Kondapur', totalReports: 31, type: 'hostel',
    history: generateHistory(52, 'volatile'),
  },
  {
    accommodationId: 'demo-16', name: 'Sreekar Balgoni Ladies PG', latitude: 17.4333, longitude: 78.3333,
    ssi: 22, area: 'Narsingi', totalReports: 38, type: 'hostel',
    history: generateHistory(48, 'down'),
  },
];

// ── Map Endpoints ────────────────────────────────────────────
export async function fetchMapMarkersWithHistory(): Promise<MapMarkerWithHistory[]> {
  try {
    const { data } = await api.get('/map/markers/history');
    return data.markers ?? data;
  } catch {
    return DEMO_MARKERS;
  }
}

// ── AI Summary Generator ─────────────────────────────────────
const COMPLAINT_THEMES: Record<string, string[]> = {
  'Food-related complaints increased significantly': ['hygiene', 'food'],
  'Theft incidents reported in common areas': ['theft', 'security'],
  'Electricity supply issues reported frequently': ['electricity'],
  'Water supply interruptions noted': ['water'],
  'Fire safety violations identified': ['fire_safety'],
  'Noise complaints from neighboring units': ['noise'],
  'Security personnel inadequacy': ['security'],
  'Harassment complaints from residents': ['harassment'],
  'Poor hygiene and sanitation standards': ['hygiene'],
};

export function generateAISummary(marker: MapMarkerWithHistory, selectedMonth: string): AISummary {
  const monthIdx = marker.history.findIndex((h) => h.month === selectedMonth);
  const current = marker.history[monthIdx]?.score ?? marker.ssi;
  const prev = monthIdx > 0 ? marker.history[monthIdx - 1].score : current;
  const first = marker.history[0]?.score ?? current;
  const diff = current - first;
  const monthCount = marker.history.length;

  let trend: AISummary['trend'] = 'stable';
  if (diff > 5) trend = 'improving';
  else if (diff < -5) trend = 'declining';

  let riskLevel: AISummary['riskLevel'] = 'safe';
  if (current < 60) riskLevel = 'high-risk';
  else if (current < 80) riskLevel = 'moderate';

  // Pick complaint themes based on score
  const themeKeys = Object.keys(COMPLAINT_THEMES);
  const selectedThemes = [
    themeKeys[Math.abs(marker.name.charCodeAt(0)) % themeKeys.length],
    themeKeys[Math.abs(marker.name.charCodeAt(1)) % themeKeys.length],
  ];

  const trendWord = trend === 'declining' ? 'declined' : trend === 'improving' ? 'improved' : 'remained relatively stable';
  const rangeText = trend !== 'stable'
    ? `${trendWord} from ${first} to ${current} over ${monthCount} months`
    : `remained stable around ${current} over ${monthCount} months`;

  const riskText = riskLevel === 'high-risk'
    ? 'This accommodation is trending toward High Risk status.'
    : riskLevel === 'moderate'
    ? 'This accommodation shows moderate safety concerns.'
    : 'This accommodation maintains good safety standards.';

  const summary = `${rangeText}. ${selectedThemes[0]}. ${riskText}`;

  return {
    accommodationId: marker.accommodationId,
    summary,
    trend,
    riskLevel,
  };
}

// ── Dashboard Endpoints ──────────────────────────────────────
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const { data } = await api.get('/analytics/dashboard');
    return data;
  } catch {
    const avg = DEMO_MARKERS.reduce((s, m) => s + m.ssi, 0) / DEMO_MARKERS.length;
    return {
      totalAccommodations: DEMO_MARKERS.length,
      totalReports: DEMO_MARKERS.reduce((s, m) => s + m.totalReports, 0),
      verifiedReports: DEMO_MARKERS.reduce((s, m) => s + Math.round(m.totalReports * 0.6), 0),
      averageSSI: Math.round(avg),
      highRiskCount: DEMO_MARKERS.filter((m) => m.ssi >= 80).length,
      mediumRiskCount: DEMO_MARKERS.filter((m) => m.ssi >= 60 && m.ssi < 80).length,
      lowRiskCount: DEMO_MARKERS.filter((m) => m.ssi < 60).length,
    };
  }
}

export async function fetchSSITrend(): Promise<SSITrend[]> {
  try {
    const { data } = await api.get('/analytics/ssi-trend');
    return data.trend ?? data;
  } catch {
    return generateMockTrend();
  }
}

export async function fetchAreaRisks(): Promise<AreaRisk[]> {
  try {
    const { data } = await api.get('/analytics/area-risks');
    return data.areas ?? data;
  } catch {
    return generateMockAreaRisks();
  }
}

export async function fetchCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  try {
    const { data } = await api.get('/analytics/categories');
    return data.categories ?? data;
  } catch {
    return generateMockCategories();
  }
}

export async function fetchRecentReports(): Promise<RecentReport[]> {
  try {
    const { data } = await api.get('/analytics/recent-reports');
    return data.reports ?? data;
  } catch {
    return generateMockRecentReports();
  }
}

// ── Mock Data Generators ─────────────────────────────────────
function generateMockTrend(): SSITrend[] {
  const trend: SSITrend[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    trend.push({
      date: d.toISOString().split('T')[0],
      averageSSI: 50 + Math.round(Math.sin(i * 0.3) * 15 + Math.random() * 10),
      reportsCount: Math.floor(Math.random() * 8) + 1,
    });
  }
  return trend;
}

function generateMockAreaRisks(): AreaRisk[] {
  return [
    { area: 'Madhapur', averageSSI: 72, reportCount: 8, accommodations: 12 },
    { area: 'Kondapur', averageSSI: 65, reportCount: 12, accommodations: 15 },
    { area: 'Gachibowli', averageSSI: 58, reportCount: 15, accommodations: 18 },
    { area: 'Hitech City', averageSSI: 75, reportCount: 6, accommodations: 10 },
    { area: 'Kukatpally', averageSSI: 45, reportCount: 20, accommodations: 22 },
    { area: 'Ameerpet', averageSSI: 52, reportCount: 18, accommodations: 16 },
    { area: 'Dilshuknagar', averageSSI: 38, reportCount: 25, accommodations: 20 },
    { area: 'LB Nagar', averageSSI: 42, reportCount: 22, accommodations: 14 },
  ];
}

function generateMockCategories(): CategoryBreakdown[] {
  return [
    { category: 'theft', count: 35, percentage: 22 },
    { category: 'hygiene', count: 28, percentage: 18 },
    { category: 'electricity', count: 22, percentage: 14 },
    { category: 'water', count: 20, percentage: 13 },
    { category: 'security', count: 18, percentage: 11 },
    { category: 'fire_safety', count: 14, percentage: 9 },
    { category: 'noise', count: 12, percentage: 8 },
    { category: 'harassment', count: 5, percentage: 3 },
    { category: 'other', count: 3, percentage: 2 },
  ];
}

function generateMockRecentReports(): RecentReport[] {
  const areas = ['Madhapur', 'Kondapur', 'Gachibowli', 'Kukatpally', 'Ameerpet'];
  const names = [
    'Sunshine PG', 'Vertex Hostel', 'City Nest', 'Green Valley PG',
    'Rainbow Residence', 'Comfort Stay', 'Student Inn', 'Safe Harbor',
  ];
  const cats: RecentReport['category'][] = [
    'theft', 'hygiene', 'electricity', 'water', 'security',
  ];
  const statuses: RecentReport['status'][] = [
    'verified', 'pending', 'disputed', 'resolved',
  ];

  return Array.from({ length: 10 }, (_, i) => ({
    id: `rpt-${i + 1}`,
    accommodationName: names[i % names.length],
    area: areas[i % areas.length],
    category: cats[i % cats.length],
    severity: (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    status: statuses[i % statuses.length],
    date: new Date(Date.now() - i * 3600000 * 4).toISOString(),
  }));
}
