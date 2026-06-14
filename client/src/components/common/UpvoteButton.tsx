import { useState, useCallback } from 'react';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

interface UpvoteButtonProps {
  reportId: string;
  initialCount: number;
  initialUpvoted?: boolean;
  className?: string;
}

export function UpvoteButton({ reportId, initialCount, initialUpvoted = false, className }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    if (loading) return;

    // Optimistic update
    const wasUpvoted = upvoted;
    const prevCount = count;
    setUpvoted(!wasUpvoted);
    setCount(wasUpvoted ? prevCount - 1 : prevCount + 1);
    setLoading(true);

    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${API_URL}/api/reports/${reportId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('Upvote failed');

      const data = await res.json();
      // Use server response for accurate count
      const serverCount = data.data?.upvotes ?? data.upvotes;
      const serverUpvoted = data.data?.upvoted ?? data.upvoted;
      if (serverCount !== undefined) setCount(serverCount);
      if (serverUpvoted !== undefined) setUpvoted(serverUpvoted);
    } catch {
      // Revert on error
      setUpvoted(wasUpvoted);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  }, [reportId, upvoted, count, loading]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
        upvoted
          ? 'bg-primary-100 text-primary-700 border border-primary-200'
          : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700',
        loading && 'opacity-70 cursor-wait',
        className
      )}
    >
      <ThumbsUp className={cn('h-4 w-4', upvoted && 'fill-primary-500')} />
      <span>{count}</span>
    </button>
  );
}
