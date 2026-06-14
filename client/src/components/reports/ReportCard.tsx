import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Edit3, Trash2, CheckCircle, Brain, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, getSeverityColor, getStatusColor } from '@/lib/utils';
import { UpvoteButton } from '@/components/common/UpvoteButton';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';
import { useAuthStore } from '@/stores/authStore';
import type { Report, User } from '@/types';
import { CATEGORY_LABELS } from '@/types';

interface Props {
  report: Report;
  index?: number;
  onDelete?: (id: string) => void;
}

const categoryIcons: Record<string, string> = {
  fire_safety: '🔥',
  water_quality: '💧',
  structural: '🏗️',
  electrical: '⚡',
  hygiene: '🧹',
  security: '🔒',
  food_safety: '🍽️',
  other: '📋',
};

function getConsensusBadge(consensus?: string) {
  switch (consensus) {
    case 'accept':
      return { label: 'AI Verified', color: 'bg-emerald-100 text-emerald-700' };
    case 'reject':
      return { label: 'AI Flagged', color: 'bg-red-100 text-red-700' };
    default:
      return { label: 'AI Pending', color: 'bg-slate-100 text-slate-500' };
  }
}

export function ReportCard({ report, index = 0, onDelete }: Props) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const severityLabel =
    report.severity <= 3 ? 'low' : report.severity <= 6 ? 'medium' : report.severity <= 8 ? 'high' : 'critical';
  const accommodation = typeof report.accommodationId === 'object' ? report.accommodationId : null;
  const reportUser = report.userId && typeof report.userId === 'object' ? (report.userId as User) : null;
  const isOwner = user && reportUser && user._id === reportUser._id;
  const isUpvoted = user ? report.upvotesBy?.includes(user._id) : false;
  const consensus = report.aiVerification?.consensus;
  const consensusBadge = getConsensusBadge(consensus);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className="p-5 hover:shadow-card-hover transition-all hover:-translate-y-0.5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">{categoryIcons[report.category] || '📋'}</span>
            <h3
              className="text-sm font-semibold text-slate-900 line-clamp-1 cursor-pointer hover:text-primary-600 transition-colors"
              onClick={() => navigate(`/report/${report._id}`)}
            >
              {report.title}
            </h3>
          </div>
          <Badge className={cn('text-xs ml-2 shrink-0', getStatusColor(report.status))}>{report.status}</Badge>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {CATEGORY_LABELS[report.category] || report.category}
          </Badge>
          <Badge className={cn('text-xs', getSeverityColor(severityLabel))}>{severityLabel}</Badge>
          {consensus && (
            <Badge className={cn('text-xs flex items-center gap-1', consensusBadge.color)}>
              <Brain className="h-3 w-3" />
              {consensusBadge.label}
            </Badge>
          )}
        </div>

        {/* AI Verdict Summary */}
        {report.aiVerification?.overallConfidence !== undefined && (
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-medium">AI Confidence:</span>{' '}
            {report.aiVerification.overallConfidence}%
          </div>
        )}

        {/* Resolution */}
        {report.status === 'resolved' && (report.ownerResponse || report.resolution) && (
          <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 mb-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Resolved
            </div>
            <p className="text-xs text-emerald-600 line-clamp-2">{report.ownerResponse?.response || report.resolution?.description}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          {accommodation && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {accommodation.name}, {accommodation.area}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(report.createdAt)}
          </span>
        </div>

        {/* Footer: upvote + badges + actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <UpvoteButton
              reportId={report._id}
              initialCount={report.upvotes || 0}
              initialUpvoted={isUpvoted}
            />
            {reportUser?.isVerified && <VerifiedBadge college={reportUser.college} />}
          </div>

          {isOwner && (
            <div className="flex items-center gap-1">
              {report.status === 'pending' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/report/${report._id}?edit=true`);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  title="Edit report"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(report._id);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete report"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
