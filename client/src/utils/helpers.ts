import { SSILevel } from '../types';

/**
 * Returns the CSS class for an SSI level badge.
 */
export function ssiBadgeClass(level: SSILevel): string {
  switch (level) {
    case 'high':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'medium':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'low':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
  }
}

/**
 * Format a date string into a human-readable relative time.
 */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format a number with Indian numbering system (e.g. 1,23,456).
 */
export function formatIndianNumber(n: number): string {
  return n.toLocaleString('en-IN');
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
