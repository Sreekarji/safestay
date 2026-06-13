import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getSSIColor(ssi: number): string {
  if (ssi >= 80) return '#10B981';
  if (ssi >= 60) return '#F59E0B';
  if (ssi >= 40) return '#F97316';
  return '#EF4444';
}

export function getSSILabel(ssi: number): string {
  if (ssi >= 80) return 'Very Safe';
  if (ssi >= 60) return 'Moderate';
  if (ssi >= 40) return 'Caution';
  return 'High Risk';
}

export function getSSITailwind(ssi: number): string {
  if (ssi >= 80) return 'bg-emerald-100 text-emerald-700';
  if (ssi >= 60) return 'bg-amber-100 text-amber-700';
  if (ssi >= 40) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'critical': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'verified': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
