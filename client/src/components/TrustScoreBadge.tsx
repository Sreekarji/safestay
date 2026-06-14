import React from 'react';

interface TrustScoreBadgeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  score,
  label,
  size = 'md',
  showNumber = true
}) => {
  const getColor = () => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
    if (score >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
  };

  const getLabel = () => {
    if (label) return label;
    if (score >= 80) return 'Safe';
    if (score >= 50) return 'Caution';
    return 'Unsafe';
  };

  const getEmoji = () => {
    if (score >= 80) return '🟢';
    if (score >= 50) return '🟡';
    return '🔴';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const colors = getColor();

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}>
      <span>{getEmoji()}</span>
      {showNumber && <span className="font-bold">{score}</span>}
      <span>{getLabel()}</span>
    </div>
  );
};

export default React.memo(TrustScoreBadge);
