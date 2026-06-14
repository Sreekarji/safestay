import React, { useState, useCallback } from 'react';

interface UpvoteButtonProps {
  reportId: string;
  initialUpvotes: number;
  initialHasUpvoted: boolean;
  isOwnReport: boolean;
}

const UpvoteButton: React.FC<UpvoteButtonProps> = ({
  reportId,
  initialUpvotes,
  initialHasUpvoted,
  isOwnReport
}) => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [loading, setLoading] = useState(false);

  const handleUpvote = useCallback(async () => {
    if (isOwnReport || loading) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    const prevUpvotes = upvotes;
    const prevHasUpvoted = hasUpvoted;

    setHasUpvoted(prev => !prev);
    setUpvotes(prev => hasUpvoted ? prev - 1 : prev + 1);

    try {
      const response = await fetch(
        `${API}/api/reports/${reportId}/upvote`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setUpvotes(data.data.upvotes);
        setHasUpvoted(data.data.upvoted);
      } else {
        setUpvotes(prevUpvotes);
        setHasUpvoted(prevHasUpvoted);
      }
    } catch {
      setUpvotes(prevUpvotes);
      setHasUpvoted(prevHasUpvoted);
    } finally {
      setLoading(false);
    }
  }, [reportId, hasUpvoted, upvotes, isOwnReport, loading]);

  if (isOwnReport) {
    return (
      <div className="flex items-center gap-1.5 text-gray-400 text-sm py-2">
        <span>👥</span>
        <span>{upvotes} {upvotes === 1 ? 'confirmation' : 'confirmations'}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border w-full justify-center
        ${hasUpvoted
          ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className={`transition-transform duration-200 ${hasUpvoted ? 'scale-110' : ''}`}>
        {hasUpvoted ? '✅' : '👆'}
      </span>
      <span>{hasUpvoted ? 'Confirmed' : 'I experienced this too'}</span>
      {upvotes > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          hasUpvoted ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
        }`}>
          {upvotes}
        </span>
      )}
    </button>
  );
};

export default React.memo(UpvoteButton);