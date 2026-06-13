import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, getSeverityColor, getStatusColor } from '@/lib/utils';
import type { Report } from '@/types';

interface Props { report: Report; index?: number; }

const categoryLabels: Record<string, string> = {
  fire_safety: 'Fire Safety', water_quality: 'Water Quality', structural: 'Structural',
  electrical: 'Electrical', hygiene: 'Hygiene', security: 'Security',
  food_safety: 'Food Safety', other: 'Other',
};

export function ReportCard({ report, index = 0 }: Props) {
  const navigate = useNavigate();
  const severityLabel = report.severity <= 3 ? 'low' : report.severity <= 6 ? 'medium' : report.severity <= 8 ? 'high' : 'critical';
  const accommodation = typeof report.accommodationId === 'object' ? report.accommodationId : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className="p-5 cursor-pointer hover:shadow-card-hover transition-all hover:-translate-y-0.5" onClick={() => navigate(`/report/${report._id}`)}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{report.title}</h3>
          <Badge className={cn("text-xs ml-2 shrink-0", getStatusColor(report.status))}>{report.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">{categoryLabels[report.category] || report.category}</Badge>
          <Badge className={cn("text-xs", getSeverityColor(severityLabel))}>{severityLabel}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {accommodation && <span className="flex items-center gap-1">{accommodation.name}, {accommodation.area}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(report.createdAt)}</span>
        </div>
      </Card>
    </motion.div>
  );
}
