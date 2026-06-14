import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

interface VerifiedBadgeProps {
  collegeName?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
  collegeName, 
  size = 'md',
  showTooltip = true 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const tooltipText = collegeName 
    ? `Verified student from ${collegeName}` 
    : 'Verified college student';

  return (
    <div 
      className={`inline-flex items-center bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-200 hover:bg-blue-100 transition-colors ${sizeClasses[size]}`}
      title={showTooltip ? tooltipText : undefined}
    >
      <FiCheckCircle className={`${iconSizes[size]} text-blue-600`} />
      <span>Verified Student</span>
    </div>
  );
};

export default VerifiedBadge;