import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  college?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function VerifiedBadge({ college, size = 'sm', className }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        className
      )}
      title={college ? `Verified Student — ${college}` : 'Verified Student'}
    >
      <svg className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span>Verified Student</span>
    </span>
  );
}
