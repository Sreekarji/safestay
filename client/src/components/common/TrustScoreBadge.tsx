import { cn } from '@/lib/utils';

interface TrustScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

function getConfig(score: number) {
  if (score >= 70) return { label: 'Safe', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', ring: 'text-emerald-600' };
  if (score >= 40) return { label: 'Moderate', color: 'bg-amber-100 text-amber-700 border-amber-200', ring: 'text-amber-600' };
  return { label: 'Risky', color: 'bg-red-100 text-red-700 border-red-200', ring: 'text-red-600' };
}

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function TrustScoreBadge({ score, size = 'md', showLabel = true, className }: TrustScoreBadgeProps) {
  const { label, color } = getConfig(score);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold border',
        color,
        sizes[size],
        className
      )}
    >
      <span className="font-bold">{score}</span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}
