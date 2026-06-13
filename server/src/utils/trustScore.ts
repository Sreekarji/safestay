import { IReport } from '../models/Report.js';

// Category multipliers (higher = more impact on SSI)
const CATEGORY_MULTIPLIERS: Record<string, number> = {
  security: 1.5,
  food_safety: 1.3,
  fire_safety: 1.3,
  water_quality: 1.3,
  hygiene: 1.0,
  structural: 0.8,
  electrical: 0.8,
  other: 0.8,
};

// Severity weights
const getSeverityWeight = (severity: number): number => {
  if (severity <= 3) return 5;    // Low
  if (severity <= 6) return 15;   // Medium
  return 30;                       // High
};

// Time decay: older reports lose weight over 365 days
const getTimeDecay = (createdAt: Date): number => {
  const now = new Date();
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0.1, 1 - (daysSinceCreation / 365));
};

// Upvote multiplier: more upvotes = more impact
const getUpvoteMultiplier = (upvotes: number): number => {
  return 1 + (Math.min(upvotes, 20) * 0.1);
};

// Status multiplier
const getStatusMultiplier = (status: IReport['status']): number => {
  switch (status) {
    case 'verified': return 0.2;     // Resolved issues have minimal impact
    case 'resolved': return 0.5;     // Resolved but not verified
    case 'approved': return 1.0;     // Approved reports have full impact
    case 'ai_verified': return 0.9;  // AI verified but not admin approved
    case 'pending': return 0.6;      // Pending reports have reduced impact
    case 'disputed': return 1.2;     // Disputed reports have extra impact
    case 'rejected': return 0;       // Rejected reports have no impact
    default: return 0.5;
  }
};

export interface SSICalculationResult {
  ssi: number;
  penalties: Array<{
    reportId: string;
    category: string;
    penalty: number;
    severityWeight: number;
    categoryMultiplier: number;
    timeDecay: number;
    upvoteMultiplier: number;
    statusMultiplier: number;
  }>;
  categoryScores: Record<string, number>;
}

export const calculateSSI = (
  reports: IReport[],
  currentSSI: number = 50
): SSICalculationResult => {
  let totalPenalty = 0;
  const penalties: SSICalculationResult['penalties'] = [];
  const categoryPenalties: Record<string, number[]> = {};

  // Filter to only reports that affect SSI (exclude rejected)
  const activeReports = reports.filter(r => r.status !== 'rejected');

  for (const report of activeReports) {
    const severityWeight = getSeverityWeight(report.severity);
    const categoryMultiplier = CATEGORY_MULTIPLIERS[report.category] || 0.8;
    const timeDecay = getTimeDecay(report.createdAt);
    const upvoteMultiplier = getUpvoteMultiplier(report.upvotes);
    const statusMultiplier = getStatusMultiplier(report.status);

    const penalty = severityWeight * categoryMultiplier * timeDecay * upvoteMultiplier * statusMultiplier;

    totalPenalty += penalty;

    penalties.push({
      reportId: report._id.toString(),
      category: report.category,
      penalty,
      severityWeight,
      categoryMultiplier,
      timeDecay,
      upvoteMultiplier,
      statusMultiplier,
    });

    // Track per-category penalties
    if (!categoryPenalties[report.category]) {
      categoryPenalties[report.category] = [];
    }
    categoryPenalties[report.category].push(penalty);
  }

  // Calculate final SSI (0-100)
  const ssi = Math.max(0, Math.min(100, 100 - totalPenalty));

  // Calculate category scores (100 - avg penalty per category)
  const categoryScores: Record<string, number> = {
    fire_safety: 50,
    water_quality: 50,
    structural: 50,
    electrical: 50,
    hygiene: 50,
    security: 50,
  };

  for (const [category, penalties] of Object.entries(categoryPenalties)) {
    if (penalties.length > 0) {
      const avgPenalty = penalties.reduce((a, b) => a + b, 0) / penalties.length;
      categoryScores[category] = Math.max(0, Math.min(100, 100 - avgPenalty));
    }
  }

  return {
    ssi: Math.round(ssi * 10) / 10, // Round to 1 decimal
    penalties,
    categoryScores,
  };
};

// Get risk level from SSI
export const getRiskLevel = (ssi: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (ssi >= 80) return 'low';
  if (ssi >= 50) return 'medium';
  if (ssi >= 20) return 'high';
  return 'critical';
};

// Get SSI label
export const getSSILabel = (ssi: number): string => {
  if (ssi >= 80) return 'Safe';
  if (ssi >= 50) return 'Caution';
  return 'Unsafe';
};

// Get SSI color
export const getSSIColor = (ssi: number): string => {
  if (ssi >= 80) return '#22c55e'; // Green
  if (ssi >= 50) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};
